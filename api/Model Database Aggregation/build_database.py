#!/usr/bin/env python3
"""
Car App — local database assembler.

Builds a complete local SQLite database of:
    brands -> models -> model_years -> trims -> {engines, transmissions}

from two free sources (vPIC for the hierarchy, CarQuery for trims + specs),
with a **disk cache** so the first run fetches and every later run rebuilds the
database fully OFFLINE with no rate limits. Reuses the parsing/DB helpers in
ingest.py.

Two ways to source the brand/model hierarchy:
  * default ("api")  -> crawl vPIC GetModelsForMakeYear (car+mpv+truck)
  * "vpic-db"        -> read a restored official vPIC dump (SQLite) offline
                        (convert the NHTSA .bak with a community tool first;
                         see README). Removes vPIC API calls entirely.

Trims + engine + transmission always come from CarQuery (cached).

Examples
--------
# Build recent Porsche + Honda, 2020-2024, into a local DB
python3 build_database.py --db ~/cars.db --make porsche --make honda \
        --from 2020 --to 2024

# Build EVERY US make for 2024 (large; cache makes re-runs free/offline)
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024

# Rebuild entirely from cache after a previous run (no network):
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 --offline

# Use a restored official vPIC dump for the hierarchy:
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 \
        --vpic-db ~/vpic_lite.sqlite

Stdlib only. No pip installs.
"""

import argparse
import hashlib
import json
import logging
import sqlite3
import sys
import time
from pathlib import Path

import ingest  # parsing + upsert helpers live here


log = logging.getLogger("build")


# --------------------------------------------------------------------------- #
#  Disk cache  (turns the crawler into an offline-after-first-pass builder)
# --------------------------------------------------------------------------- #
class Cache:
    def __init__(self, root, offline=False):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.offline = offline
        self.hits = self.misses = 0

    def _path(self, key):
        return self.root / (hashlib.md5(key.encode()).hexdigest() + ".json")

    def get_or(self, key, producer):
        p = self._path(key)
        if p.exists():
            try:
                self.hits += 1
                return json.loads(p.read_text())
            except Exception:  # corrupt cache entry -> refetch
                pass
        if self.offline:
            self.hits += 1
            return []  # offline + not cached -> treat as empty, keep going
        self.misses += 1
        value = producer()
        p.write_text(json.dumps(value))
        return value


# --------------------------------------------------------------------------- #
#  Hierarchy sources
# --------------------------------------------------------------------------- #
def make_list(cache):
    """All US consumer makes (car + mpv + truck), unioned and de-duped."""
    def fetch():
        makes = set()
        for vt in ingest.VPIC_VEHICLE_TYPES:
            url = f"{ingest.VPIC}/GetMakesForVehicleType/{vt}?format=json"
            try:
                data = ingest.get_json(url)
            except Exception as e:  # noqa: BLE001
                log.warning("make list (%s) failed: %s", vt, e)
                continue
            for r in data.get("Results", []):
                makes.add(r["MakeName"])
        return sorted(makes)
    return cache.get_or("makes", fetch)


def models_api(cache, make, year):
    """(model_id, model_name) for make/year via vPIC, cached."""
    rows = cache.get_or(f"models:{make}:{year}",
                        lambda: ingest.vpic_models(make, year))
    return [(r[0], r[1]) for r in rows]   # tolerate list-ified tuples from JSON


def models_from_dump(conn, make):
    """(model_id, model_name) for a make from a restored vPIC SQLite dump.

    Official vPIC schema: Make(Id,Name), Model(Id,Name), Make_Model(MakeId,ModelId).
    The dump has no clean model-year table, so years are confirmed downstream by
    whether CarQuery returns trims for that year.
    """
    cur = conn.execute(
        "SELECT mo.Id, mo.Name FROM Make ma "
        "JOIN Make_Model mm ON mm.MakeId = ma.Id "
        "JOIN Model mo ON mo.Id = mm.ModelId "
        "WHERE lower(ma.Name) = lower(?) ORDER BY mo.Name",
        (make,),
    )
    return cur.fetchall()


def trims_for(cache, make, model, year):
    return cache.get_or(f"trims:{make}:{model}:{year}",
                        lambda: ingest.carquery_trims(make, model, year))


# --------------------------------------------------------------------------- #
#  Build
# --------------------------------------------------------------------------- #
def build(cx, cache, makes, years, vpic_conn=None, rate=0.3):
    totals = {"models": 0, "trims": 0, "engines": 0}
    for make in makes:
        brand_id = ingest.upsert_brand(cx, make, ingest.vpic_make_id(make)
                                       if vpic_conn is None and not cache.offline else None)
        # resolve the make's models once if using the dump (year-independent)
        dump_models = models_from_dump(vpic_conn, make) if vpic_conn is not None else None

        for year in years:
            if dump_models is not None:
                models = dump_models
            else:
                models = models_api(cache, make, year)
            if models:
                log.info("%s %s: %d models", make.title(), year, len(models))

            for vpic_id, model_name in models:
                model_id = ingest.upsert_model(cx, brand_id, model_name, vpic_id)
                trims = trims_for(cache, make, model_name, year)
                if not trims:
                    continue
                # only materialise the model-year when we have real trims for it
                my_id = ingest.upsert_model_year(cx, model_id, year)
                totals["models"] += 1
                for t in trims:
                    tid = ingest.insert_trim(cx, my_id, t)
                    if tid is None:
                        continue
                    ingest.insert_engine(cx, tid, t)
                    ingest.insert_transmission(cx, tid, t)
                    totals["trims"] += 1
                    totals["engines"] += 1
                log.info("    %s %s: %d trims", model_name, year, len(trims))
                cx.commit()
                if not cache.offline:
                    time.sleep(rate)  # polite to CarQuery on first pass only
    return totals


# --------------------------------------------------------------------------- #
#  CLI
# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(description="Assemble the car database locally")
    ap.add_argument("--db", default="cars.db", help="output SQLite file")
    ap.add_argument("--schema", default="schema.sql")
    ap.add_argument("--cache", default="cache", help="HTTP cache dir")
    ap.add_argument("--make", action="append", help="repeatable; e.g. --make honda")
    ap.add_argument("--all-makes", action="store_true")
    ap.add_argument("--from", dest="y0", type=int, required=True, help="first model year")
    ap.add_argument("--to", dest="y1", type=int, required=True, help="last model year")
    ap.add_argument("--vpic-db", help="path to restored vPIC dump (SQLite) for hierarchy")
    ap.add_argument("--offline", action="store_true",
                    help="build only from cache; make no network calls")
    ap.add_argument("--rate", type=float, default=0.3, help="seconds between CarQuery calls")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING,
                        format="%(message)s")
    log.setLevel(logging.INFO)

    years = list(range(args.y0, args.y1 + 1))
    cache = Cache(args.cache, offline=args.offline)

    cx = sqlite3.connect(args.db)
    cx.execute("PRAGMA foreign_keys = ON")
    cx.executescript(Path(args.schema).read_text())

    vpic_conn = sqlite3.connect(args.vpic_db) if args.vpic_db else None

    if args.all_makes:
        makes = make_list(cache)
    else:
        makes = args.make or []
    if not makes:
        sys.exit("Provide --make NAME (repeatable) or --all-makes")

    log.info("Building %d makes x %d years -> %s", len(makes), len(years), args.db)
    t0 = time.time()
    totals = build(cx, cache, makes, years, vpic_conn=vpic_conn, rate=args.rate)

    # summary
    print("\n=== build complete in %.1fs ===" % (time.time() - t0))
    print(f"cache: {cache.hits} hits, {cache.misses} fetches "
          f"({'offline' if args.offline else 'online'})")
    for tbl in ("brands", "models", "model_years", "trims", "engines", "transmissions"):
        n = cx.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        print(f"{tbl:>14}: {n}")
    cx.close()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Car App — free MVP ingestion.

Pulls the basic hierarchy + engine/transmission metadata into SQLite using only
free, no-key data sources:

  * NHTSA vPIC   -> brands (makes), models, model years   (free, no key)
  * CarQuery API -> trims + engine + transmission specs    (free, no key)

Generations are intentionally NOT populated here — there is no clean free API.
Leave the `generations` table empty for now and backfill from Wikidata or by hand.

Usage:
    python3 ingest.py --db cars.db --make honda --year 2023
    python3 ingest.py --db cars.db --make honda --year 2023 --year 2024
    python3 ingest.py --db cars.db --all-makes --year 2023   # large / slow

Stdlib only — no pip installs required.
"""

import argparse
import json
import re
import sqlite3
import sys
import time
import urllib.parse
import urllib.request

VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles"
CARQUERY = "https://www.carqueryapi.com/api/0.3/"

# CarQuery blocks server-side requests that lack a browser-like User-Agent.
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json,text/javascript,*/*",
}


# --------------------------------------------------------------------------- #
#  HTTP helpers
# --------------------------------------------------------------------------- #
def _get(url, tries=3, pause=1.0):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(pause * (attempt + 1))
    raise RuntimeError(f"GET failed after {tries} tries: {url}\n  {last}")


def get_json(url):
    """Parse JSON, tolerating CarQuery's occasional `?(...)` JSONP wrapper."""
    raw = _get(url).strip()
    if raw.startswith("?(") or raw.startswith("("):
        raw = raw[raw.find("(") + 1 : raw.rfind(")")]
    return json.loads(raw)


# --------------------------------------------------------------------------- #
#  Source: NHTSA vPIC
# --------------------------------------------------------------------------- #
# vPIC classifies SUVs as MPV, not "car" — filtering on car alone silently drops
# the Macan, Cayenne, RAV4, etc. Union the consumer vehicle types instead.
VPIC_VEHICLE_TYPES = ("car", "mpv", "truck")


def vpic_models(make, year):
    """Consumer models for a make/year. Returns list of (model_id, model_name).

    Note: vPIC only knows the *model* ('Macan'), never the variant ('Macan S').
    Variant differentiation comes from the CarQuery trim layer, not here.
    """
    seen, out = set(), []
    for vtype in VPIC_VEHICLE_TYPES:
        url = (f"{VPIC}/GetModelsForMakeYear/make/{urllib.parse.quote(make)}"
               f"/modelyear/{year}/vehicletype/{vtype}?format=json")
        try:
            data = get_json(url)
        except Exception:  # noqa: BLE001
            continue
        for m in data.get("Results", []):
            mid = m["Model_ID"]
            if mid not in seen:
                seen.add(mid)
                out.append((mid, m["Model_Name"]))
    return out


def vpic_make_id(make):
    url = f"{VPIC}/GetMakeForManufacturer/{urllib.parse.quote(make)}?format=json"
    try:
        data = get_json(url)
        for r in data.get("Results", []):
            if r.get("Make_Name", "").lower() == make.lower():
                return r.get("Make_ID")
    except Exception:
        pass
    return None


# --------------------------------------------------------------------------- #
#  Source: CarQuery
# --------------------------------------------------------------------------- #
def carquery_trims(make, model, year):
    url = (f"{CARQUERY}?cmd=getTrims&make={urllib.parse.quote(make)}"
           f"&model={urllib.parse.quote(model)}&year={year}")
    try:
        data = get_json(url)
    except Exception as e:  # noqa: BLE001
        print(f"    ! CarQuery error for {make} {model} {year}: {e}")
        return []
    return data.get("Trims", [])


# --------------------------------------------------------------------------- #
#  Small parsing helpers
# --------------------------------------------------------------------------- #
def _int(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _gears(transmission_type):
    if not transmission_type:
        return None
    m = re.search(r"(\d+)\s*[- ]?\s*speed", transmission_type, re.I)
    return int(m.group(1)) if m else None


def _trans_kind(t):
    if not t:
        return None
    low = t.lower()
    if "cvt" in low:
        return "CVT"
    if "dct" in low or "dual" in low:
        return "DCT"
    if "manual" in low:
        return "manual"
    if "auto" in low:
        return "automatic"
    return t


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# --------------------------------------------------------------------------- #
#  DB helpers (upserts)
# --------------------------------------------------------------------------- #
def upsert_brand(cx, name, vpic_make_id=None):
    slug = slugify(name)
    cx.execute(
        "INSERT INTO brands (name, slug, vpic_make_id) VALUES (?,?,?) "
        "ON CONFLICT(slug) DO UPDATE SET vpic_make_id=COALESCE(excluded.vpic_make_id, brands.vpic_make_id)",
        (name.title(), slug, vpic_make_id),
    )
    return cx.execute("SELECT id FROM brands WHERE slug=?", (slug,)).fetchone()[0]


def upsert_model(cx, brand_id, name, vpic_model_id=None):
    slug = slugify(name)
    cx.execute(
        "INSERT INTO models (brand_id, name, slug, vpic_model_id) VALUES (?,?,?,?) "
        "ON CONFLICT(brand_id, slug) DO UPDATE SET "
        "vpic_model_id=COALESCE(excluded.vpic_model_id, models.vpic_model_id)",
        (brand_id, name, slug, vpic_model_id),
    )
    return cx.execute(
        "SELECT id FROM models WHERE brand_id=? AND slug=?", (brand_id, slug)
    ).fetchone()[0]


def upsert_model_year(cx, model_id, year):
    cx.execute(
        "INSERT OR IGNORE INTO model_years (model_id, year) VALUES (?,?)",
        (model_id, year),
    )
    return cx.execute(
        "SELECT id FROM model_years WHERE model_id=? AND year=?", (model_id, year)
    ).fetchone()[0]


def insert_trim(cx, model_year_id, t):
    trim = (t.get("model_trim") or "").strip()
    name = trim or "(base)"
    # full_name is the differentiator the app browses on: "Macan" vs "Macan S".
    model = (t.get("model_name") or "").strip()
    full_name = f"{model} {trim}".strip() if trim else model
    cq_id = t.get("model_id")
    cx.execute(
        "INSERT OR IGNORE INTO trims "
        "(model_year_id, name, full_name, carquery_id, body, doors, seats, specs_json, source) "
        "VALUES (?,?,?,?,?,?,?,?, 'carquery')",
        (model_year_id, name, full_name, cq_id, t.get("model_body"),
         _int(t.get("model_doors")), _int(t.get("model_seats")), json.dumps(t)),
    )
    row = cx.execute(
        "SELECT id FROM trims WHERE model_year_id=? AND name=? AND carquery_id IS ?",
        (model_year_id, name, cq_id),
    ).fetchone()
    return row[0] if row else None


def insert_engine(cx, trim_id, t):
    cc = _float(t.get("model_engine_cc"))
    cx.execute(
        "INSERT INTO engines "
        "(trim_id, displacement_l, cylinders, configuration, fuel_type, "
        " horsepower, hp_rpm, torque_nm, valves, extra_json) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        (trim_id,
         round(cc / 1000, 1) if cc else _float(t.get("model_engine_l")),
         _int(t.get("model_engine_cyl")),
         t.get("model_engine_type"),
         t.get("model_engine_fuel"),
         _int(t.get("model_engine_power_ps")),   # PS ~= hp; raw kept in extra_json
         _int(t.get("model_engine_power_rpm")),
         _int(t.get("model_engine_torque_nm")),
         _int(t.get("model_engine_valves_per_cyl")),
         json.dumps({k: v for k, v in t.items() if k.startswith("model_engine")})),
    )


def insert_transmission(cx, trim_id, t):
    ttype = t.get("model_transmission_type")
    cx.execute(
        "INSERT INTO transmissions (trim_id, type, gears, drive_type, extra_json) "
        "VALUES (?,?,?,?,?)",
        (trim_id, _trans_kind(ttype), _gears(ttype),
         t.get("model_drive"), json.dumps({"raw_type": ttype})),
    )


# --------------------------------------------------------------------------- #
#  Orchestration
# --------------------------------------------------------------------------- #
def ingest_make_year(cx, make, year):
    print(f"== {make.title()} {year} ==")
    brand_id = upsert_brand(cx, make, vpic_make_id(make))
    models = vpic_models(make, year)
    print(f"  vPIC: {len(models)} passenger models")

    for vpic_id, model_name in models:
        model_id = upsert_model(cx, brand_id, model_name, vpic_id)
        my_id = upsert_model_year(cx, model_id, year)

        trims = carquery_trims(make, model_name, year)
        if trims:
            print(f"  - {model_name}: {len(trims)} trims")
        for t in trims:
            trim_id = insert_trim(cx, my_id, t)
            if trim_id is None:
                continue
            insert_engine(cx, trim_id, t)
            insert_transmission(cx, trim_id, t)
        cx.commit()
        time.sleep(0.3)  # be polite to CarQuery


def all_makes(year):
    url = f"{VPIC}/GetMakesForVehicleType/car?format=json"
    data = get_json(url)
    return sorted({r["MakeName"] for r in data.get("Results", [])})


def main():
    ap = argparse.ArgumentParser(description="Free MVP car-data ingestion")
    ap.add_argument("--db", default="cars.db")
    ap.add_argument("--make", action="append", help="repeatable; e.g. --make honda")
    ap.add_argument("--year", action="append", type=int, required=True,
                    help="repeatable; e.g. --year 2023 --year 2024")
    ap.add_argument("--all-makes", action="store_true",
                    help="ingest every passenger-car make (large/slow)")
    ap.add_argument("--schema", default="schema.sql")
    args = ap.parse_args()

    cx = sqlite3.connect(args.db)
    cx.execute("PRAGMA foreign_keys = ON")
    with open(args.schema) as f:
        cx.executescript(f.read())

    for year in args.year:
        makes = all_makes(year) if args.all_makes else (args.make or [])
        if not makes:
            sys.exit("Provide --make NAME (repeatable) or --all-makes")
        for make in makes:
            try:
                ingest_make_year(cx, make, year)
            except Exception as e:  # noqa: BLE001
                print(f"  !! skipped {make} {year}: {e}")

    # tiny summary
    for tbl in ("brands", "models", "model_years", "trims", "engines", "transmissions"):
        n = cx.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        print(f"{tbl:>14}: {n}")
    cx.close()


if __name__ == "__main__":
    main()

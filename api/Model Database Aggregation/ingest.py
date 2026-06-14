#!/usr/bin/env python3
"""
Car App — free MVP ingestion.

Pulls the basic hierarchy + engine/transmission/fuel-economy metadata into
SQLite using only free, no-key data sources:

  * NHTSA vPIC      -> brands (makes), models, model years   (free, no key)
  * fueleconomy.gov -> trims + engine + transmission + fuel economy (free, no key,
                       DOE/EPA). Replaces the now-defunct CarQuery API.

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
import xml.etree.ElementTree as ET

VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles"
FUELECONOMY = "https://www.fueleconomy.gov/ws/rest/vehicle"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/xml,application/xml,*/*",
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
    return json.loads(_get(url))


def get_xml(url):
    return ET.fromstring(_get(url))


# --------------------------------------------------------------------------- #
#  Source: NHTSA vPIC  (brand / model / model-year hierarchy)
# --------------------------------------------------------------------------- #
# vPIC classifies SUVs as MPV, not "car" — filtering on car alone silently drops
# the Macan, Cayenne, RAV4, etc. Union the consumer vehicle types instead.
VPIC_VEHICLE_TYPES = ("car", "mpv", "truck")


def vpic_models(make, year):
    """Consumer models for a make/year. Returns list of (model_id, model_name).

    Note: vPIC only knows the *model* ('Civic'), never the variant ('Civic Si').
    Variant differentiation comes from the fueleconomy.gov layer, not here.
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
#  Source: fueleconomy.gov  (trims + engine + transmission + fuel economy)
# --------------------------------------------------------------------------- #
# fueleconomy.gov's "model" is finer-grained than vPIC's: e.g. vPIC has one
# model "Civic", fueleconomy has separate models "Civic 4Dr" / "Civic 5Dr".
# Each fueleconomy "option" is one engine+transmission+drive combination
# (a vehicle id), which we treat as a trim. See match_fe_models() for how
# fueleconomy models are mapped back onto vPIC models.
def _menu_items(url):
    root = get_xml(url)
    return [(item.findtext("value"), item.findtext("text")) for item in root.findall("menuItem")]


def fe_models(make, year):
    """fueleconomy.gov model strings for a make/year, e.g. ['Civic 4Dr', 'Civic 5Dr', ...]."""
    url = f"{FUELECONOMY}/menu/model?year={year}&make={urllib.parse.quote(make)}"
    return [text for _, text in _menu_items(url) if text]


def fe_options(make, model, year):
    """(vehicle_id, description) pairs for a fueleconomy make/model/year."""
    url = (f"{FUELECONOMY}/menu/options?year={year}&make={urllib.parse.quote(make)}"
           f"&model={urllib.parse.quote(model)}")
    return _menu_items(url)


FE_VEHICLE_FIELDS = (
    "id", "make", "model", "baseModel", "year",
    "cylinders", "displ", "drive", "trany",
    "fuelType1", "fuelType2", "VClass", "tCharger", "sCharger", "eng_dscr",
    "city08", "highway08", "comb08", "co2TailpipeGpm",
)


def fe_vehicle(vehicle_id):
    """Full vehicle record for a fueleconomy.gov vehicle id."""
    root = get_xml(f"{FUELECONOMY}/{vehicle_id}")
    return {field: root.findtext(field) for field in FE_VEHICLE_FIELDS}


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


def _trans_kind(trany):
    """Map fueleconomy's `trany` string to manual / automatic / CVT / DCT."""
    if not trany:
        return None
    low = trany.lower()
    if "manual" in low:
        return "manual"
    if "variable gear ratios" in low or "(av" in low:
        return "CVT"
    if "(am" in low:
        return "DCT"
    if "auto" in low:
        return "automatic"
    return trany


def _gears(trany):
    if not trany:
        return None
    m = re.search(r"(\d+)\s*-?\s*spd", trany, re.I)
    if m:
        return int(m.group(1))
    m = re.search(r"\((?:AV|AM)?-?S(\d+)\)", trany, re.I)
    return int(m.group(1)) if m else None


def _drive_type(drive):
    if not drive:
        return None
    low = drive.lower()
    if "front" in low:
        return "FWD"
    if "rear" in low:
        return "RWD"
    if "all" in low:
        return "AWD"
    if "4-wheel" in low or "four-wheel" in low:
        return "4WD"
    return drive


def _aspiration(tcharger, scharger):
    turbo = (tcharger or "").strip().upper() == "T"
    super_ = (scharger or "").strip().upper() == "S"
    if turbo and super_:
        return "turbo+supercharged"
    if turbo:
        return "turbo"
    if super_:
        return "supercharged"
    return "NA"


def describe_trim(v):
    """Build a human-readable engine/transmission/drive differentiator.

    fueleconomy.gov has no marketing trim names (EX/Sport/Touring), so this
    string is the closest free analog: e.g. "1.5L, 4-cyl, Turbo, CVT, FWD".
    """
    parts = []
    displ = _float(v.get("displ"))
    cyl = _int(v.get("cylinders"))
    if displ:
        parts.append(f"{displ}L")
    if cyl:
        parts.append(f"{cyl}-cyl")
    aspiration = _aspiration(v.get("tCharger"), v.get("sCharger"))
    if aspiration not in (None, "NA"):
        parts.append(aspiration.title())
    trany = v.get("trany") or ""
    kind = _trans_kind(trany)
    gears = _gears(trany)
    if kind:
        parts.append(f"{gears}-spd {kind}" if gears else kind)
    drive = _drive_type(v.get("drive"))
    if drive:
        parts.append(drive)
    return ", ".join(parts) if parts else "(base)"


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def match_fe_models(vpic_model_names, fe_model_names):
    """Map each fueleconomy model string to its best-matching vPIC model name.

    fueleconomy models are prefixed by the vPIC model name (e.g. vPIC "CR-V"
    vs fueleconomy "CR-V AWD" / "CR-V Hybrid FWD"). Ties favor the longest
    (most specific) vPIC name. Returns {fe_model_name: vpic_model_name | None}.
    """
    sorted_names = sorted(vpic_model_names, key=len, reverse=True)
    out = {}
    for fe_name in fe_model_names:
        low = fe_name.lower()
        out[fe_name] = next((n for n in sorted_names if low.startswith(n.lower())), None)
    return out


# --------------------------------------------------------------------------- #
#  DB helpers (upserts)
# --------------------------------------------------------------------------- #
def upsert_brand(cx, name, vpic_make_id_=None):
    slug = slugify(name)
    cx.execute(
        "INSERT INTO brands (name, slug, vpic_make_id) VALUES (?,?,?) "
        "ON CONFLICT(slug) DO UPDATE SET vpic_make_id=COALESCE(excluded.vpic_make_id, brands.vpic_make_id)",
        (name.title(), slug, vpic_make_id_),
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


def insert_trim(cx, model_year_id, v):
    name = describe_trim(v)
    full_name = (v.get("model") or "").strip() or None
    ext_id = v.get("id")
    cx.execute(
        "INSERT OR IGNORE INTO trims "
        "(model_year_id, name, full_name, external_id, body, doors, seats, specs_json, source) "
        "VALUES (?,?,?,?,?,?,?,?, 'fueleconomy')",
        (model_year_id, name, full_name, ext_id, v.get("VClass"), None, None, json.dumps(v)),
    )
    row = cx.execute(
        "SELECT id FROM trims WHERE model_year_id=? AND name=? AND external_id IS ?",
        (model_year_id, name, ext_id),
    ).fetchone()
    return row[0] if row else None


def insert_engine(cx, trim_id, v):
    extra = {k: v.get(k) for k in
             ("baseModel", "fuelType2", "eng_dscr", "city08", "highway08", "comb08", "co2TailpipeGpm")}
    cx.execute(
        "INSERT INTO engines "
        "(trim_id, displacement_l, cylinders, configuration, aspiration, fuel_type, "
        " horsepower, hp_rpm, torque_nm, valves, extra_json) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (trim_id,
         _float(v.get("displ")),
         _int(v.get("cylinders")),
         None,
         _aspiration(v.get("tCharger"), v.get("sCharger")),
         v.get("fuelType1"),
         None, None, None, None,
         json.dumps(extra)),
    )


def insert_transmission(cx, trim_id, v):
    trany = v.get("trany") or ""
    cx.execute(
        "INSERT INTO transmissions (trim_id, type, gears, drive_type, extra_json) "
        "VALUES (?,?,?,?,?)",
        (trim_id, _trans_kind(trany), _gears(trany), _drive_type(v.get("drive")),
         json.dumps({"raw_trany": trany, "raw_drive": v.get("drive")})),
    )


# --------------------------------------------------------------------------- #
#  Orchestration
# --------------------------------------------------------------------------- #
def ingest_make_year(cx, make, year, rate=0.1):
    print(f"== {make.title()} {year} ==")
    brand_id = upsert_brand(cx, make, vpic_make_id(make))
    vpic_list = vpic_models(make, year)
    print(f"  vPIC: {len(vpic_list)} models")

    model_id_by_name = {}
    for vid, name in vpic_list:
        model_id_by_name[name] = upsert_model(cx, brand_id, name, vid)

    fe_list = fe_models(make, year)
    matches = match_fe_models(model_id_by_name.keys(), fe_list)

    for fe_name, vpic_name in matches.items():
        if vpic_name is None:
            continue
        options = fe_options(make, fe_name, year)
        if not options:
            continue
        my_id = upsert_model_year(cx, model_id_by_name[vpic_name], year)
        n = 0
        for vehicle_id, _text in options:
            v = fe_vehicle(vehicle_id)
            if not v:
                continue
            trim_id = insert_trim(cx, my_id, v)
            if trim_id is None:
                continue
            insert_engine(cx, trim_id, v)
            insert_transmission(cx, trim_id, v)
            n += 1
            time.sleep(rate)
        print(f"  - {fe_name} -> {vpic_name}: {n} trims")
        cx.commit()


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
    ap.add_argument("--rate", type=float, default=0.1, help="seconds between fueleconomy.gov calls")
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
                ingest_make_year(cx, make, year, rate=args.rate)
            except Exception as e:  # noqa: BLE001
                print(f"  !! skipped {make} {year}: {e}")

    # tiny summary
    for tbl in ("brands", "models", "model_years", "trims", "engines", "transmissions"):
        n = cx.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        print(f"{tbl:>14}: {n}")
    cx.close()


if __name__ == "__main__":
    main()

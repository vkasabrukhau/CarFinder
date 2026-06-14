# Car App — free data MVP

Goal of this stage: get **Brand → Model → Year → Trim** plus **engine,
transmission, and fuel-economy metadata** into a queryable database, using
only free, no-key data sources.

## Free data sources

| Layer | Source | Notes |
|---|---|---|
| Brand, Model, Year | **NHTSA vPIC** (`vpic.nhtsa.dot.gov/api`) | Free, no key. Knows the *model* ("Civic") but **never the variant** ("Civic Si"). Pulls `car` + `mpv` + `truck` types — `car` alone silently drops every SUV. Fully downloadable for local hosting. |
| Trim + engine + transmission + fuel economy | **fueleconomy.gov** (`www.fueleconomy.gov/ws/rest/vehicle`) | Free, no registration, US DOE/EPA. Each "vehicle id" is one engine + transmission + drive combination — this is where Civic 4Dr vs 5Dr vs Hybrid AWD/FWD variants live. Returns displacement, cylinders, turbo/supercharger flags, fuel type, transmission description, drive type, EPA mpg, and CO2. **No horsepower, torque, MSRP, doors, or seats** — those fields stay NULL. |
| Generation | **No clean free API** | Weak link. Pull from [Wikidata SPARQL](https://query.wikidata.org) or curate by hand. The `generations` table exists and `model_years.generation_id` is nullable so you can backfill later. |

> **CarQuery is dead.** The original plan used `carqueryapi.com` for trims,
> engines, and transmissions. As of this writing the domain no longer serves
> the API (it resolves to an unrelated AWS endpoint and fails TLS/auth on
> every request). fueleconomy.gov replaces it as the trim/spec source —
> see "Differentiating variants" below for how the mapping works.

## Files

- `schema.sql` — SQLite schema. Ports cleanly to Postgres (Supabase free tier) later.
- `build_database.py` — **the local assembler.** Cached, resumable, year ranges,
  offline rebuilds, optional vPIC-dump source. Use this to build the database.
- `ingest.py` — the underlying source/parsing/DB helper library (also runnable
  standalone for a quick single-make pull).

## Assemble the database locally  (use `build_database.py`)

```bash
# Build Honda + Toyota for 2020-2024 into a local DB (first run fetches + caches)
python3 build_database.py --db ~/cars.db --make honda --make toyota --from 2020 --to 2024 -v

# Build EVERY US make for 2024
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 -v

# Rebuild from cache with ZERO network calls (after a previous run)
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 --offline -v
```

### Why the cache matters
The first run fetches vPIC + fueleconomy.gov and saves every response under
`cache/`. Every run after that reads from `cache/` — so rebuilding the
database is fully **offline, instant, and free of rate limits**. Delete
`cache/` to force fresh data.

### Optional: source the hierarchy from the official vPIC dump (fully offline)
To drop the vPIC API entirely, restore NHTSA's standalone database and point the
builder at a SQLite copy of it:

```bash
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 \
        --vpic-db ~/vpic_lite.sqlite -v
```

Get the dump from <https://vpic.nhtsa.dot.gov/Downloads> (MS SQL `.bak` or
Postgres). Convert MS SQL -> SQLite/Postgres with a community tool such as
`samsullivandelgobbo/vPIC-dl`. In this mode the builder reads makes/models from
the dump's `Make` / `Model` / `Make_Model` tables; model-years are confirmed by
whether fueleconomy.gov has trims for that year (the dump has no clean year table).

> **Note on DB location:** keep `cars.db` on a local disk (your home dir), not a
> synced/network folder — SQLite throws `disk I/O error` on some mounted folders
> due to file locking.

## Differentiating variants (Civic 4Dr vs Civic 5Dr vs Civic Si)

This is the core modeling decision. vPIC only gives you the model **"Civic"** —
it has no concept of 4Dr / 5Dr / Si / Type R. fueleconomy.gov's "model" field
*is* that finer split (e.g. "Civic 4Dr", "Civic 5Dr", "CR-V Hybrid AWD"), and
each fueleconomy "vehicle id" under that model is one engine + transmission +
drive combination.

The schema captures it as: one `models` row ("Civic") → one `model_years` row
(2023) → many `trims`, each with `full_name` (the fueleconomy model string —
the body-style/variant differentiator) and `name` (an engine/transmission/drive
description built from the data, since fueleconomy has no marketing trim names):

| full_name | name | fuel_type | transmission | drive |
|---|---|---|---|---|
| Civic 4Dr | 1.5L, 4-cyl, Turbo, CVT, FWD | Regular Gasoline | CVT | FWD |
| Civic 5Dr | 2.0L, 4-cyl, Turbo, 6-spd manual, FWD | Premium Gasoline | manual | FWD |

So query/display on `trims.full_name` for the variant and `trims.name` for the
powertrain. (Verified with the above data — see "Verified example query".)

### Matching fueleconomy models to vPIC models

`ingest.match_fe_models()` maps each fueleconomy model string to the
**longest vPIC model name it starts with** (case-insensitive), e.g.
fueleconomy "CR-V Hybrid AWD" -> vPIC "CR-V". A fueleconomy model that matches
no vPIC model name is skipped. When scaling past a few makes, spot-check that
fueleconomy's model strings actually share a prefix with vPIC's model name —
naming conventions occasionally diverge (e.g. abbreviations, hyphenation).

## Verified example query

```sql
SELECT b.name, m.name, t.full_name, t.name,
       json_extract(e.extra_json, '$.comb08') AS combined_mpg
FROM trims t
JOIN engines e        ON e.trim_id = t.id
JOIN transmissions tr ON tr.trim_id = t.id
JOIN model_years my   ON my.id = t.model_year_id
JOIN models m         ON m.id = my.model_id
JOIN brands b         ON b.id = m.brand_id
WHERE tr.type = 'manual'
ORDER BY combined_mpg DESC;
-- -> Honda | Civic | Civic 4Dr | 1.5L, 4-cyl, Turbo, 6-spd manual, FWD | 31
-- -> Honda | Civic | Civic 5Dr | 1.5L, 4-cyl, Turbo, 6-spd manual, FWD | 31
-- -> Honda | Civic | Civic 5Dr | 2.0L, 4-cyl, 6-spd manual, FWD       | 29
-- -> Honda | Civic | Civic 5Dr | 2.0L, 4-cyl, Turbo, 6-spd manual, FWD | 24
-- -> Toyota | GR Corolla | GR Corolla | 1.6L, 3-cyl, Turbo, 6-spd manual, AWD | 24
```

## Known limitations / honest notes

- **No horsepower, torque, MSRP, doors, or seats.** fueleconomy.gov doesn't
  report these; those columns stay NULL for fueleconomy-sourced trims. If you
  need them, a future phase would have to add a third source (and another
  matching layer).
- **Bonus data**: `engines.extra_json` carries EPA city/highway/combined MPG
  and tailpipe CO2 (g/mi) for every trim — useful for the app's cost-of-ownership
  features, and something CarQuery never had.
- **Coverage**: fueleconomy.gov covers model years roughly 1984–present for
  the US market; very old/rare/non-US-market vehicles may have no match.
- **Generations** are not auto-populated (see above).
- **Name matching**: the vPIC <-> fueleconomy model-name prefix match (above)
  is a heuristic — spot-check when adding new makes.

## Next steps (later phases)

1. Backfill `generations` from Wikidata SPARQL.
2. Move from SQLite to Supabase Postgres (free tier) — schema is compatible.
3. Add a horsepower/torque/MSRP source and the paid-data layers from the
   original plan (repair/tire pricing, warranty, CPO, brand history/market
   share) once the free core is solid.

# Car App — free data MVP

Goal of this stage: get **Brand → Model → Year → Trim** plus **engine & transmission
metadata** into a queryable database, using only free, no-key data sources.

## Free data sources (verified live, June 2026)

| Layer | Source | Notes |
|---|---|---|
| Brand, Model, Year | **NHTSA vPIC** (`vpic.nhtsa.dot.gov/api`) | Free, no key. Knows the *model* ("Macan") but **never the variant** ("Macan S"). Pulls `car` + `mpv` + `truck` types — `car` alone silently drops every SUV. Fully downloadable for local hosting. |
| Trim + engine + transmission | **CarQuery API** (`carqueryapi.com/api/0.3`) | Free, no registration. **This is where Macan vs Macan S lives** (`model_trim`), each with its own engine. Returns displacement, cylinders, power (PS), torque (Nm), transmission, drive, body, seats, doors. **Requires a browser `User-Agent` header on server calls** (handled in `ingest.py`). |
| Generation | **No clean free API** | Weak link. Pull from [Wikidata SPARQL](https://query.wikidata.org) or curate by hand. The `generations` table exists and `model_years.generation_id` is nullable so you can backfill later. |

## Files

- `schema.sql` — SQLite schema. Ports cleanly to Postgres (Supabase free tier) later.
- `build_database.py` — **the local assembler.** Cached, resumable, year ranges,
  offline rebuilds, optional vPIC-dump source. Use this to build the database.
- `ingest.py` — the underlying source/parsing/DB helper library (also runnable
  standalone for a quick single-make pull).

## Assemble the database locally  (use `build_database.py`)

```bash
# Build Porsche + Honda for 2020-2024 into a local DB (first run fetches + caches)
python3 build_database.py --db ~/cars.db --make porsche --make honda --from 2020 --to 2024 -v

# Build EVERY US make for 2024
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 -v

# Rebuild from cache with ZERO network calls (after a previous run)
python3 build_database.py --db ~/cars.db --all-makes --from 2024 --to 2024 --offline -v
```

### Why the cache matters
The first run fetches vPIC + CarQuery and saves every response under `cache/`.
Every run after that reads from `cache/` — so rebuilding the database is fully
**offline, instant, and free of rate limits**. Delete `cache/` to force fresh data.
This is what makes it a real local-assembly tool rather than a fragile crawler.
*(Verified: a cached rebuild ran with 0 network fetches and produced the full
Macan / Macan S / Macan GTS differentiation.)*

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
whether CarQuery has trims for that year (the dump has no clean year table).

> **Note on DB location:** keep `cars.db` on a local disk (your home dir), not a
> synced/network folder — SQLite throws `disk I/O error` on some mounted folders
> due to file locking.

## Differentiating variants (Macan vs Macan S)

This is the core modeling decision. vPIC only gives you the model **"Macan"** — it
has no concept of S / GTS / Turbo, and it's inconsistent across makes (it *does*
split "718 Boxster/Cayman/Spyder" and "Civic Si/Type R" into separate models, but
lumps all Macans together). **Do not rely on vPIC's model list to separate variants.**

The split lives in CarQuery's `model_trim`, and each trim has its own engine. The
schema captures it as: one `models` row ("Macan") → one `model_years` row (2023) →
many `trims`, each with `name` (the trim) and `full_name` (the differentiator you
browse on):

| full_name | engine | power |
|---|---|---|
| Macan | 2.0L I4 | 265 PS |
| Macan S | 2.9L V6 | 380 PS |
| Macan GTS | 2.9L V6 | 440 PS |

So query/display on `trims.full_name`, not on `models.name`. (Verified with the
above data.)

> **Naming-mismatch caveat:** because vPIC and CarQuery disagree on granularity,
> the trim pull is driven by CarQuery, with vPIC used for the authoritative make
> list and model existence. When scaling past a few makes, spot-check that
> CarQuery's `model_name` matches what vPIC calls the model (e.g. "718 Cayman"
> vs "Cayman").

## Verified example query

"Manual-transmission cars over 300 hp":

```sql
SELECT b.name, m.name, t.name, e.displacement_l, e.cylinders,
       e.horsepower, e.torque_nm, tr.type, tr.gears, tr.drive_type
FROM trims t
JOIN engines e        ON e.trim_id = t.id
JOIN transmissions tr ON tr.trim_id = t.id
JOIN model_years my   ON my.id = t.model_year_id
JOIN models m         ON m.id = my.model_id
JOIN brands b         ON b.id = m.brand_id
WHERE tr.type = 'manual' AND e.horsepower > 300;
-- -> Honda | Civic Type R | Type R | 2.0 | 4 | 329 | 420 | manual | 6 | Front
```

## Known limitations / honest notes

- **Power units:** CarQuery reports power in **PS**, stored in `engines.horsepower`
  (PS ≈ hp, ~1.4% high). Raw values are kept in `engines.extra_json` if you want
  to convert precisely.
- **Coverage:** CarQuery trim coverage is good but not perfect, and newest model
  years lag. vPIC is authoritative for make/model/year but thin on trims.
- **Generations** are not auto-populated (see above).
- **Name matching:** vPIC and CarQuery spell some models differently
  (e.g. trims, sub-models). Spot-check joins when you scale past a few makes.

## Next steps (later phases)

1. Backfill `generations` from Wikidata SPARQL.
2. Move from SQLite to Supabase Postgres (free tier) — schema is compatible.
3. Add the paid- data layers from the original plan (repair/tire pricing,
   warranty, CPO, brand history/market share) once the free core is solid.

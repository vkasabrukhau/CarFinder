-- ============================================================
--  Car App — free MVP schema (SQLite)
--  Hierarchy:  Brand -> Model -> Generation -> ModelYear -> Trim -> {Engine, Transmission}
--  Designed to port cleanly to Postgres later (Supabase free tier).
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- Brands ----------
CREATE TABLE IF NOT EXISTS brands (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    vpic_make_id    INTEGER UNIQUE,          -- NHTSA make id (join key)
    country         TEXT,
    -- curated / later-phase fields (left NULL for the free MVP)
    history_blurb   TEXT,
    us_market_share REAL,
    cpo_policy      TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- ---------- Models ----------
CREATE TABLE IF NOT EXISTS models (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id        INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    vpic_model_id   INTEGER,                 -- NHTSA model id
    body_class      TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE (brand_id, slug)
);

-- ---------- Generations ----------
-- Weakest free layer: no clean free API. Populate from Wikidata SPARQL or
-- curate manually. start_year/end_year let you bucket model_years into a gen.
CREATE TABLE IF NOT EXISTS generations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    name        TEXT,                        -- "11th gen", "FE/FL", "992"
    start_year  INTEGER,
    end_year    INTEGER,                     -- NULL = still in production
    description TEXT,
    source      TEXT                         -- 'wikidata' | 'manual' | ...
);

-- ---------- Model years ----------
CREATE TABLE IF NOT EXISTS model_years (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id        INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    generation_id   INTEGER REFERENCES generations(id) ON DELETE SET NULL,  -- nullable; backfilled later
    year            INTEGER NOT NULL,
    UNIQUE (model_id, year)
);

-- ---------- Trims ----------
CREATE TABLE IF NOT EXISTS trims (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    model_year_id   INTEGER NOT NULL REFERENCES model_years(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,           -- trim only: "S", "GTS", "Type R", "(base)"
    full_name       TEXT,                    -- model + trim: "Macan S"  <- the differentiator
    carquery_id     TEXT,                    -- CarQuery model_id (their trim key)
    msrp            REAL,
    body            TEXT,
    doors           INTEGER,
    seats           INTEGER,
    specs_json      TEXT,                    -- long-tail attrs as raw JSON
    source          TEXT,
    UNIQUE (model_year_id, name, carquery_id)
);

-- ---------- Engines (quintessential -> real columns) ----------
CREATE TABLE IF NOT EXISTS engines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trim_id         INTEGER NOT NULL REFERENCES trims(id) ON DELETE CASCADE,
    displacement_l  REAL,
    cylinders       INTEGER,
    configuration   TEXT,                    -- inline / V / flat
    aspiration      TEXT,                    -- NA / turbo / supercharged
    fuel_type       TEXT,
    horsepower      INTEGER,
    hp_rpm          INTEGER,
    torque_nm       INTEGER,
    valves          INTEGER,
    extra_json      TEXT
);

-- ---------- Transmissions (quintessential -> real columns) ----------
CREATE TABLE IF NOT EXISTS transmissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trim_id     INTEGER NOT NULL REFERENCES trims(id) ON DELETE CASCADE,
    type        TEXT,                        -- manual / automatic / DCT / CVT
    gears       INTEGER,
    drive_type  TEXT,                        -- FWD / RWD / AWD / 4WD
    extra_json  TEXT
);

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_models_brand       ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_modelyears_model   ON model_years(model_id);
CREATE INDEX IF NOT EXISTS idx_trims_modelyear    ON trims(model_year_id);
CREATE INDEX IF NOT EXISTS idx_trims_fullname      ON trims(full_name);
CREATE INDEX IF NOT EXISTS idx_engines_trim       ON engines(trim_id);
CREATE INDEX IF NOT EXISTS idx_trans_trim         ON transmissions(trim_id);

#!/usr/bin/env python3
"""
Export brands -> models -> {years, trims} from cars.db into a single JSON
file for the Next.js app's search-suggestion API (app/api/vehicles/route.ts).

Usage:
    python3 export_vehicle_data.py [--db cars.db] [--out ../../app/vehicle-data.json]
"""

import argparse
import json
import sqlite3
from pathlib import Path

# vPIC stores some makes in mixed case that don't match their common acronym.
BRAND_NAME_FIXES = {
    "Gmc": "GMC",
    "Bmw": "BMW",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="cars.db")
    parser.add_argument("--out", default="../../app/vehicle-data.json")
    args = parser.parse_args()

    con = sqlite3.connect(args.db)

    year_rows = con.execute(
        """
        SELECT b.name, m.name, my.year
        FROM brands b
        JOIN models m ON m.brand_id = b.id
        JOIN model_years my ON my.model_id = m.id
        ORDER BY b.name, m.name, my.year
        """
    ).fetchall()

    trim_rows = con.execute(
        """
        SELECT DISTINCT b.name, m.name, t.full_name
        FROM brands b
        JOIN models m ON m.brand_id = b.id
        JOIN model_years my ON my.model_id = m.id
        JOIN trims t ON t.model_year_id = my.id
        WHERE t.full_name IS NOT NULL AND t.full_name != ''
        ORDER BY b.name, m.name, t.full_name
        """
    ).fetchall()

    con.close()

    data: dict[str, dict[str, dict]] = {}

    def entry(brand: str, model: str) -> dict:
        brand = BRAND_NAME_FIXES.get(brand, brand)
        return data.setdefault(brand, {}).setdefault(
            model, {"years": [], "trims": []}
        )

    for brand, model, year in year_rows:
        entry(brand, model)["years"].append(year)

    for brand, model, full_name in trim_rows:
        entry(brand, model)["trims"].append(full_name)

    # Sort brands and models alphabetically for stable output.
    sorted_data = {
        brand: {model: models[model] for model in sorted(models)}
        for brand, models in sorted(data.items())
    }

    out_path = Path(args.out)
    out_path.write_text(json.dumps(sorted_data, indent=2) + "\n")
    print(f"wrote {out_path} ({len(sorted_data)} brands)")


if __name__ == "__main__":
    main()

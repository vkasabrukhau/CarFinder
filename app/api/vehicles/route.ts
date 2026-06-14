import { type NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// brand -> model -> { years sold, trim names } (from cars.db, see
// api/Model Database Aggregation/export_vehicle_data.py)
type ModelData = { years: number[]; trims: string[] };
type VehicleData = Record<string, Record<string, ModelData>>;

let cache: VehicleData | null = null;

function loadData(): VehicleData {
  if (cache) return cache;

  const filePath = path.join(process.cwd(), "app", "vehicle-data.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  cache = JSON.parse(raw) as VehicleData;

  return cache;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const make = searchParams.get("make");
  const model = searchParams.get("model");

  const data = loadData();

  if (type === "makes") {
    return Response.json(Object.keys(data).sort());
  }

  if (make && model && type === "years") {
    return Response.json(data[make]?.[model]?.years ?? []);
  }

  if (make && model && type === "trims") {
    return Response.json(data[make]?.[model]?.trims ?? []);
  }

  if (make) {
    return Response.json(Object.keys(data[make] ?? {}).sort());
  }

  return Response.json(
    {
      error:
        "Provide ?type=makes, ?make=<name>, ?make=<name>&model=<name>&type=years, or ?make=<name>&model=<name>&type=trims",
    },
    { status: 400 },
  );
}

import { type NextRequest } from "next/server";
import fs from "fs";
import path from "path";

type VehicleEntry = { Make: string; Models: string[] };

type VehicleCache = {
  makes: string[];
  modelsByMake: Record<string, string[]>;
};

let cache: VehicleCache | null = null;

function loadData(): VehicleCache {
  if (cache) return cache;

  const filePath = path.join(process.cwd(), "app", "vehicle models.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data: VehicleEntry[] = JSON.parse(raw);

  const modelsByMake: Record<string, string[]> = {};
  for (const entry of data) {
    modelsByMake[entry.Make] = [...new Set(entry.Models)].sort();
  }

  cache = {
    makes: Object.keys(modelsByMake).sort(),
    modelsByMake,
  };

  return cache;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const make = searchParams.get("make");

  const data = loadData();

  if (type === "makes") {
    return Response.json(data.makes);
  }

  if (make) {
    return Response.json(data.modelsByMake[make] ?? []);
  }

  return Response.json({ error: "Provide ?type=makes or ?make=<name>" }, { status: 400 });
}

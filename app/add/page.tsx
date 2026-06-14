"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { VehicleAutocomplete } from "@/components/ui/vehicle-autocomplete";

// ── Static autocomplete options ───────────────────────────────────────────────

const ENGINES = [
  "4-Cylinder", "6-Cylinder", "V6", "V8", "V10", "V12",
  "Inline-4", "Inline-6", "Turbocharged 4-Cylinder", "Turbocharged V6",
  "Electric Motor", "Hybrid",
];
const FUEL_TYPES = [
  "Gasoline", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid", "Flex Fuel", "Hydrogen",
];
const BODY_TYPES = [
  "Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Wagon",
  "Convertible", "Van", "Minivan", "Crossover",
];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Dual-Clutch", "Semi-Automatic"];
const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD", "4x4"];

// ── Vehicle data cache (module-level — fetched once per session) ──────────────

let _makesCache: string[] | null = null;
const _modelsCache = new Map<string, string[]>();
const _yearsCache = new Map<string, string[]>();
const _trimsCache = new Map<string, string[]>();

async function fetchMakes(): Promise<string[]> {
  if (_makesCache) return _makesCache;
  const data: string[] = await fetch("/api/vehicles?type=makes").then((r) => r.json());
  _makesCache = data;
  return data;
}

async function fetchModels(make: string): Promise<string[]> {
  if (_modelsCache.has(make)) return _modelsCache.get(make)!;
  const data: unknown = await fetch(`/api/vehicles?make=${encodeURIComponent(make)}`).then((r) => r.json());
  const models = Array.isArray(data) ? (data as string[]) : [];
  _modelsCache.set(make, models);
  return models;
}

async function fetchYears(make: string, model: string): Promise<string[]> {
  const key = `${make} ${model}`;
  if (_yearsCache.has(key)) return _yearsCache.get(key)!;
  const data: unknown = await fetch(
    `/api/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&type=years`,
  ).then((r) => r.json());
  const years = Array.isArray(data) ? (data as number[]).map(String) : [];
  _yearsCache.set(key, years);
  return years;
}

async function fetchTrims(make: string, model: string): Promise<string[]> {
  const key = `${make} ${model}`;
  if (_trimsCache.has(key)) return _trimsCache.get(key)!;
  const data: unknown = await fetch(
    `/api/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&type=trims`,
  ).then((r) => r.json());
  const trims = Array.isArray(data) ? (data as string[]) : [];
  _trimsCache.set(key, trims);
  return trims;
}

// ── Bar data ──────────────────────────────────────────────────────────────────

const milesBars = [
  { label: "0k", value: 0, count: 29 },
  { label: "10k", value: 10000, count: 47 },
  { label: "20k", value: 20000, count: 63 },
  { label: "30k", value: 30000, count: 82 },
  { label: "40k", value: 40000, count: 95 },
  { label: "50k", value: 50000, count: 89 },
  { label: "60k", value: 60000, count: 73 },
  { label: "70k", value: 70000, count: 55 },
  { label: "80k", value: 80000, count: 39 },
  { label: "90k", value: 90000, count: 25 },
  { label: "100k+", value: 100000, count: 19 },
];

const priceBars = [
  { label: "$5k", value: 5000, count: 11 },
  { label: "$10k", value: 10000, count: 33 },
  { label: "$15k", value: 15000, count: 67 },
  { label: "$20k", value: 20000, count: 92 },
  { label: "$25k", value: 25000, count: 86 },
  { label: "$30k", value: 30000, count: 64 },
  { label: "$35k", value: 35000, count: 43 },
  { label: "$40k", value: 40000, count: 29 },
  { label: "$45k", value: 45000, count: 18 },
  { label: "$50k+", value: 50000, count: 14 },
];

// Full year span covered by cars.db (see api/Model Database Aggregation),
// shown before a Make/Model narrows the range.
const DEFAULT_YEARS = Array.from({ length: 2026 - 2015 + 1 }, (_, i) => String(2015 + i));

// ── Helpers ───────────────────────────────────────────────────────────────────

// Year bars have no real listing-count data (cars.db only knows which years a
// model was sold), so give them the same bell-curve shape as the Miles/Price
// histograms for visual consistency.
function bellCurveCounts(n: number): number[] {
  if (n === 0) return [];
  if (n === 1) return [50];
  const mid = (n - 1) / 2;
  return Array.from({ length: n }, (_, i) => {
    const t = (i - mid) / mid;
    return Math.round(95 - 75 * t * t);
  });
}

function closestIndex(value: number, values: number[]): number {
  let best = 0;
  let bestDiff = Math.abs(values[0] - value);
  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i] - value);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

// ── BarRangeSelector ──────────────────────────────────────────────────────────

const BAR_MAX_PX = 80;

function BarRangeSelector({
  bars,
  selectedRange,
  onRangeChange,
}: {
  bars: { label: string; count: number }[];
  selectedRange: [number, number];
  onRangeChange: (r: [number, number]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartIdx = useRef<number | null>(null);
  const maxCount = Math.max(...bars.map((b) => b.count));

  useEffect(() => {
    const stop = () => {
      isDragging.current = false;
      dragStartIdx.current = null;
    };
    document.addEventListener("mouseup", stop);
    return () => document.removeEventListener("mouseup", stop);
  }, []);

  function idxFromX(clientX: number): number {
    const el = containerRef.current;
    if (!el) return 0;
    const { left, width } = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(0.9999, (clientX - left) / width));
    return Math.floor(pct * bars.length);
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const idx = idxFromX(e.clientX);
    isDragging.current = true;
    dragStartIdx.current = idx;
    onRangeChange([idx, idx]);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || dragStartIdx.current === null) return;
    const idx = idxFromX(e.clientX);
    const s = dragStartIdx.current;
    onRangeChange([Math.min(s, idx), Math.max(s, idx)]);
  }

  const [minIdx, maxIdx] = selectedRange;
  const step = Math.ceil(bars.length / 7);

  return (
    <div
      ref={containerRef}
      className="cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {/* Bars */}
      <div className="flex items-end gap-0.5" style={{ height: BAR_MAX_PX }}>
        {bars.map((bar, i) => {
          const selected = i >= minIdx && i <= maxIdx;
          const h = Math.max(
            4,
            Math.round((bar.count / maxCount) * BAR_MAX_PX),
          );
          return (
            <div
              key={bar.label}
              className={cn(
                "flex-1 rounded-t-[3px] transition-colors duration-75",
                selected ? "bg-[#383838]" : "bg-[#383838]/20",
              )}
              style={{ height: h }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex mt-1">
        {bars.map((bar, i) => {
          const show = i === 0 || i === bars.length - 1 || i % step === 0;
          return (
            <div key={bar.label} className="flex-1 text-center overflow-hidden">
              <span
                className={cn(
                  "text-[10px] leading-none text-muted-foreground",
                  !show && "invisible",
                )}
              >
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Input style ───────────────────────────────────────────────────────────────

const field =
  "w-full bg-transparent text-foreground placeholder:text-foreground/30 " +
  "px-0 py-2 outline-none border-0 border-b border-foreground " +
  "text-[45px] leading-none [appearance:textfield] " +
  "[&::-webkit-outer-spin-button]:appearance-none " +
  "[&::-webkit-inner-spin-button]:appearance-none";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [engines, setEngines] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [keywords, setKeywords] = useState("");
  const [driveType, setDriveType] = useState("");

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  const [milesRange, setMilesRange] = useState<[number, number]>([
    0,
    milesBars.length - 1,
  ]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    priceBars.length - 1,
  ]);
  const [yearRange, setYearRange] = useState<[number, number]>([
    0,
    DEFAULT_YEARS.length - 1,
  ]);

  useEffect(() => {
    fetchMakes().then(setMakes).catch(() => {});
  }, []);

  // Loads the Model list once a Make is selected.
  useEffect(() => {
    if (!make) return;
    fetchModels(make).then(setModels).catch(() => {});
  }, [make]);

  // Loads the Year range + Trim options once a Model is selected.
  useEffect(() => {
    if (!make || !model) return;
    fetchYears(make, model)
      .then((ys) => {
        setYears(ys);
        setYearRange([0, Math.max(0, ys.length - 1)]);
      })
      .catch(() => {});
    fetchTrims(make, model).then(setTrims).catch(() => {});
  }, [make, model]);

  // Cascading resets: changing Make clears Model/Trim/Year, changing Model
  // clears Trim/Year — the data-loading effects above then repopulate them.
  function handleMakeChange(value: string) {
    setMake(value);
    setModel("");
    setTrim("");
    setModels([]);
    setYears([]);
    setTrims([]);
    setYearRange([0, DEFAULT_YEARS.length - 1]);
  }

  function handleModelChange(value: string) {
    setModel(value);
    setTrim("");
    setYears([]);
    setTrims([]);
    setYearRange([0, DEFAULT_YEARS.length - 1]);
  }

  const milesValues = milesBars.map((b) => b.value);
  const priceValues = priceBars.map((b) => b.value);

  const minMiles = milesBars[milesRange[0]].value;
  const maxMiles = milesBars[milesRange[1]].value;
  const minPrice = priceBars[priceRange[0]].value;
  const maxPrice = priceBars[priceRange[1]].value;

  const displayYears = years.length > 0 ? years : DEFAULT_YEARS;
  const yearCounts = bellCurveCounts(displayYears.length);
  const yearBars = displayYears.map((y, i) => ({ label: y, value: Number(y), count: yearCounts[i] }));
  const yearValues = yearBars.map((b) => b.value);
  const minYear = yearBars[yearRange[0]]?.value ?? "";
  const maxYear = yearBars[yearRange[1]]?.value ?? "";
  const yearDisabled = years.length === 0;

  return (
    <main className="flex flex-col gap-6 p-6 h-[calc(100dvh-3.5rem)]">
      <div className="grid flex-1 min-h-0 grid-cols-3 gap-6">
        {/* ── Column 1: Make · Year · Engines · Fuel Type ── */}
        <div className="flex flex-col gap-20">
          <VehicleAutocomplete
            items={makes}
            value={make}
            onValueChange={handleMakeChange}
            placeholder="Make"
            inputClassName={field}
          />

          <div className="flex gap-6">
            <input
              className={field}
              type="number"
              placeholder="Min Year"
              value={minYear}
              disabled={yearDisabled}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.min(
                  closestIndex(v, yearValues),
                  yearRange[1],
                );
                setYearRange([idx, yearRange[1]]);
              }}
            />
            <input
              className={field}
              type="number"
              placeholder="Max Year"
              value={maxYear}
              disabled={yearDisabled}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.max(
                  closestIndex(v, yearValues),
                  yearRange[0],
                );
                setYearRange([yearRange[0], idx]);
              }}
            />
          </div>

          <BarRangeSelector
            bars={yearBars}
            selectedRange={yearRange}
            onRangeChange={setYearRange}
          />

          <AutocompleteField
            items={ENGINES}
            value={engines}
            onValueChange={setEngines}
            placeholder="Engines"
            className={field}
          />

          <AutocompleteField
            items={FUEL_TYPES}
            value={fuelType}
            onValueChange={setFuelType}
            placeholder="Fuel Type"
            className={field}
          />
        </div>

        {/* ── Column 2: Model · Miles · Body Type · Transmission ── */}
        <div className="flex flex-col gap-20">
          <VehicleAutocomplete
            items={models}
            value={model}
            onValueChange={handleModelChange}
            placeholder="Model"
            inputClassName={field}
            disabled={!make}
          />

          <div className="flex gap-6">
            <input
              className={field}
              type="number"
              placeholder="Min Miles"
              value={minMiles}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.min(
                  closestIndex(v, milesValues),
                  milesRange[1],
                );
                setMilesRange([idx, milesRange[1]]);
              }}
            />
            <input
              className={field}
              type="number"
              placeholder="Max Miles"
              value={maxMiles}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.max(
                  closestIndex(v, milesValues),
                  milesRange[0],
                );
                setMilesRange([milesRange[0], idx]);
              }}
            />
          </div>

          <BarRangeSelector
            bars={milesBars}
            selectedRange={milesRange}
            onRangeChange={setMilesRange}
          />

          <AutocompleteField
            items={BODY_TYPES}
            value={bodyType}
            onValueChange={setBodyType}
            placeholder="Body Type"
            className={field}
          />

          <AutocompleteField
            items={TRANSMISSIONS}
            value={transmission}
            onValueChange={setTransmission}
            placeholder="Transmission"
            className={field}
          />
        </div>

        {/* ── Column 3: Trim · Price · Keywords · Drive Type ── */}
        <div className="flex flex-col gap-20">
          <VehicleAutocomplete
            items={trims}
            value={trim}
            onValueChange={setTrim}
            placeholder="Trim"
            inputClassName={field}
            disabled={!make || !model}
          />

          <div className="flex gap-6">
            <input
              className={field}
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.min(
                  closestIndex(v, priceValues),
                  priceRange[1],
                );
                setPriceRange([idx, priceRange[1]]);
              }}
            />
            <input
              className={field}
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.max(
                  closestIndex(v, priceValues),
                  priceRange[0],
                );
                setPriceRange([priceRange[0], idx]);
              }}
            />
          </div>

          <BarRangeSelector
            bars={priceBars}
            selectedRange={priceRange}
            onRangeChange={setPriceRange}
          />

          <input
            className={field}
            placeholder="Key Words"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />

          <AutocompleteField
            items={DRIVE_TYPES}
            value={driveType}
            onValueChange={setDriveType}
            placeholder="Drive Type"
            className={field}
          />
        </div>
      </div>

      <Button size="lg" className="w-full">
        Add Car Search
      </Button>
    </main>
  );
}

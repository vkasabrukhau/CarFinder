"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Bar data ──────────────────────────────────────────────────────────────────

const yearBars = [
  { label: "2010", value: 2010, count: 14 },
  { label: "2011", value: 2011, count: 18 },
  { label: "2012", value: 2012, count: 23 },
  { label: "2013", value: 2013, count: 31 },
  { label: "2014", value: 2014, count: 39 },
  { label: "2015", value: 2015, count: 54 },
  { label: "2016", value: 2016, count: 62 },
  { label: "2017", value: 2017, count: 76 },
  { label: "2018", value: 2018, count: 89 },
  { label: "2019", value: 2019, count: 97 },
  { label: "2020", value: 2020, count: 81 },
  { label: "2021", value: 2021, count: 67 },
  { label: "2022", value: 2022, count: 73 },
  { label: "2023", value: 2023, count: 84 },
  { label: "2024", value: 2024, count: 71 },
  { label: "2025", value: 2025, count: 42 },
];

const milesBars = [
  { label: "0k",    value: 0,      count: 29 },
  { label: "10k",   value: 10000,  count: 47 },
  { label: "20k",   value: 20000,  count: 63 },
  { label: "30k",   value: 30000,  count: 82 },
  { label: "40k",   value: 40000,  count: 95 },
  { label: "50k",   value: 50000,  count: 89 },
  { label: "60k",   value: 60000,  count: 73 },
  { label: "70k",   value: 70000,  count: 55 },
  { label: "80k",   value: 80000,  count: 39 },
  { label: "90k",   value: 90000,  count: 25 },
  { label: "100k+", value: 100000, count: 19 },
];

const priceBars = [
  { label: "$5k",   value: 5000,  count: 11 },
  { label: "$10k",  value: 10000, count: 33 },
  { label: "$15k",  value: 15000, count: 67 },
  { label: "$20k",  value: 20000, count: 92 },
  { label: "$25k",  value: 25000, count: 86 },
  { label: "$30k",  value: 30000, count: 64 },
  { label: "$35k",  value: 35000, count: 43 },
  { label: "$40k",  value: 40000, count: 29 },
  { label: "$45k",  value: 45000, count: 18 },
  { label: "$50k+", value: 50000, count: 14 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function closestIndex(value: number, values: number[]): number {
  let best = 0;
  let bestDiff = Math.abs(values[0] - value);
  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i] - value);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
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
          const h = Math.max(4, Math.round((bar.count / maxCount) * BAR_MAX_PX));
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
  const [make, setMake]       = useState("");
  const [model, setModel]     = useState("");
  const [trims, setTrims]     = useState("");
  const [engines, setEngines] = useState("");
  const [bodyType, setBodyType]   = useState("");
  const [keywords, setKeywords]   = useState("");

  const [yearRange, setYearRange]   = useState<[number, number]>([0, yearBars.length - 1]);
  const [milesRange, setMilesRange] = useState<[number, number]>([0, milesBars.length - 1]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, priceBars.length - 1]);

  const yearValues  = yearBars.map((b) => b.value);
  const milesValues = milesBars.map((b) => b.value);
  const priceValues = priceBars.map((b) => b.value);

  const minYear  = yearBars[yearRange[0]].value;
  const maxYear  = yearBars[yearRange[1]].value;
  const minMiles = milesBars[milesRange[0]].value;
  const maxMiles = milesBars[milesRange[1]].value;
  const minPrice = priceBars[priceRange[0]].value;
  const maxPrice = priceBars[priceRange[1]].value;

  return (
    <main className="flex flex-col gap-6 p-6 h-[calc(100dvh-3.5rem)]">
      <div className="grid flex-1 min-h-0 grid-cols-3 gap-6">

        {/* ── Column 1: Make · Year · Engines ── */}
        <div className="flex flex-col gap-3">
          <input
            className={field}
            placeholder="Make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />

          <div className="flex gap-3">
            <input
              className={field}
              type="number"
              placeholder="Min Year"
              value={minYear}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.min(closestIndex(v, yearValues), yearRange[1]);
                setYearRange([idx, yearRange[1]]);
              }}
            />
            <input
              className={field}
              type="number"
              placeholder="Max Year"
              value={maxYear}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.max(closestIndex(v, yearValues), yearRange[0]);
                setYearRange([yearRange[0], idx]);
              }}
            />
          </div>

          <BarRangeSelector
            bars={yearBars}
            selectedRange={yearRange}
            onRangeChange={setYearRange}
          />

          <input
            className={field}
            placeholder="Engines"
            value={engines}
            onChange={(e) => setEngines(e.target.value)}
          />
        </div>

        {/* ── Column 2: Model · Miles · Body Type ── */}
        <div className="flex flex-col gap-3">
          <input
            className={field}
            placeholder="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />

          <div className="flex gap-3">
            <input
              className={field}
              type="number"
              placeholder="Min Miles"
              value={minMiles}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.min(closestIndex(v, milesValues), milesRange[1]);
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
                const idx = Math.max(closestIndex(v, milesValues), milesRange[0]);
                setMilesRange([milesRange[0], idx]);
              }}
            />
          </div>

          <BarRangeSelector
            bars={milesBars}
            selectedRange={milesRange}
            onRangeChange={setMilesRange}
          />

          <input
            className={field}
            placeholder="Body Type"
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
          />
        </div>

        {/* ── Column 3: Trims · Price · Keywords ── */}
        <div className="flex flex-col gap-3">
          <input
            className={field}
            placeholder="Trims"
            value={trims}
            onChange={(e) => setTrims(e.target.value)}
          />

          <div className="flex gap-3">
            <input
              className={field}
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                const idx = Math.min(closestIndex(v, priceValues), priceRange[1]);
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
                const idx = Math.max(closestIndex(v, priceValues), priceRange[0]);
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
        </div>
      </div>

      <Button size="lg" className="w-full">
        Add Car Search
      </Button>
    </main>
  );
}

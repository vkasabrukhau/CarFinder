"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Car = {
  searchId: string; model: string; preference: string; tracking: string;
  lowEnd: string; highEnd: string; avg: string; available: string; turnover: string;
  engine: string; horsepower: string; torque: string;
  tankSize: string; range: string; fuelGrade: string; mpgCity: string; mpgHwy: string;
  frontBrakes: string; rearBrakes: string;
  driverAssist: string;
  length: string; width: string; height: string; wheelbase: string; curbWeight: string;
  topSpeed: string; zeroToSixty: string; nurburgring: string;
  passengers: string; cargoVolume: string;
  insurance: string; maintenance: string;
};

const CAR_LIST: Car[] = [
  {
    searchId: "honda-civic", model: "Honda Civic", preference: "#1", tracking: "Active",
    lowEnd: "$18,500", highEnd: "$23,900", avg: "$21,200", available: "84", turnover: "4.2%",
    engine: "1.5L Turbo 4-Cyl", horsepower: "192 hp", torque: "192 lb-ft",
    tankSize: "12.4 gal", range: "~390 mi", fuelGrade: "87 Regular", mpgCity: "32 mpg", mpgHwy: "42 mpg",
    frontBrakes: "11.1\" Ventilated Disc", rearBrakes: "10.2\" Ventilated Disc",
    driverAssist: "Honda Sensing — ACC, LKAS, CMBS, RDM",
    length: "182.7\"", width: "70.9\"", height: "55.7\"", wheelbase: "106.3\"", curbWeight: "2,877 lbs",
    topSpeed: "137 mph", zeroToSixty: "7.1 s", nurburgring: "N/A",
    passengers: "5", cargoVolume: "14.8 cu ft",
    insurance: "$1,044–$1,344 / yr", maintenance: "~$400 / yr",
  },
  {
    searchId: "toyota-camry", model: "Toyota Camry", preference: "#2", tracking: "Active",
    lowEnd: "$21,000", highEnd: "$28,600", avg: "$24,750", available: "67", turnover: "3.8%",
    engine: "2.5L 4-Cyl / 3.5L V6", horsepower: "203–301 hp", torque: "184–267 lb-ft",
    tankSize: "16.0 gal", range: "~480 mi", fuelGrade: "87 Regular", mpgCity: "28 mpg", mpgHwy: "39 mpg",
    frontBrakes: "12.0\" Ventilated Disc", rearBrakes: "11.1\" Solid Disc",
    driverAssist: "Toyota Safety Sense 2.0 — Pre-Collision, LDA, ACC, LTA",
    length: "192.1\"", width: "72.4\"", height: "56.9\"", wheelbase: "111.0\"", curbWeight: "3,310 lbs",
    topSpeed: "135 mph", zeroToSixty: "7.6 s (4-cyl) / 5.8 s (V6)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "15.1 cu ft",
    insurance: "$1,150–$1,500 / yr", maintenance: "~$500 / yr",
  },
  {
    searchId: "mazda-cx-5", model: "Mazda CX-5", preference: "#3", tracking: "Watch",
    lowEnd: "$24,300", highEnd: "$32,100", avg: "$28,100", available: "41", turnover: "2.9%",
    engine: "2.5L NA / 2.5L Turbo 4-Cyl", horsepower: "187–256 hp", torque: "186–320 lb-ft",
    tankSize: "15.3 gal", range: "~420 mi", fuelGrade: "87 Regular (93 for Turbo)", mpgCity: "27 mpg", mpgHwy: "33 mpg",
    frontBrakes: "12.8\" Ventilated Disc", rearBrakes: "11.9\" Solid Disc",
    driverAssist: "Mazda i-Activsense — MRCC, LAS, SCBS, RVM",
    length: "179.1\"", width: "72.5\"", height: "65.4\"", wheelbase: "106.3\"", curbWeight: "3,607 lbs",
    topSpeed: "130 mph", zeroToSixty: "7.3 s (NA) / 5.7 s (Turbo)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "30.9 cu ft",
    insurance: "$1,200–$1,600 / yr", maintenance: "~$520 / yr",
  },
  {
    searchId: "subaru-outback", model: "Subaru Outback", preference: "#4", tracking: "Active",
    lowEnd: "$26,900", highEnd: "$35,750", avg: "$30,800", available: "38", turnover: "3.1%",
    engine: "2.5L Boxer 4-Cyl / 2.4L Turbo Boxer", horsepower: "182–260 hp", torque: "174–277 lb-ft",
    tankSize: "18.8 gal", range: "~500 mi", fuelGrade: "87 Regular", mpgCity: "26 mpg", mpgHwy: "33 mpg",
    frontBrakes: "12.4\" Ventilated Disc", rearBrakes: "11.4\" Solid Disc",
    driverAssist: "Subaru EyeSight — ACC, Pre-Collision, Lane Keep, Sway Warning",
    length: "191.3\"", width: "73.0\"", height: "66.1\"", wheelbase: "108.1\"", curbWeight: "3,638 lbs",
    topSpeed: "127 mph", zeroToSixty: "7.8 s (2.5) / 6.1 s (Turbo)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "32.5 cu ft",
    insurance: "$1,300–$1,700 / yr", maintenance: "~$550 / yr",
  },
  {
    searchId: "vw-jetta", model: "VW Jetta", preference: "#5", tracking: "Watch",
    lowEnd: "$19,800", highEnd: "$26,400", avg: "$22,900", available: "29", turnover: "2.4%",
    engine: "1.4L Turbo / 2.0L Turbo (GLI)", horsepower: "147–228 hp", torque: "184–258 lb-ft",
    tankSize: "13.2 gal", range: "~370 mi", fuelGrade: "87 Regular (91 for GLI)", mpgCity: "29 mpg", mpgHwy: "40 mpg",
    frontBrakes: "12.3\" Ventilated Disc", rearBrakes: "11.0\" Solid Disc",
    driverAssist: "IQ.Drive — ACC, Lane Assist, AEB, Blind Spot Monitor",
    length: "185.1\"", width: "70.7\"", height: "57.7\"", wheelbase: "105.6\"", curbWeight: "2,990 lbs",
    topSpeed: "130 mph (155 GLI)", zeroToSixty: "8.3 s (1.4T) / 5.6 s (GLI)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "14.1 cu ft",
    insurance: "$1,100–$1,450 / yr", maintenance: "~$630 / yr",
  },
  {
    searchId: "hyundai-elantra", model: "Hyundai Elantra", preference: "#6", tracking: "Active",
    lowEnd: "$17,200", highEnd: "$22,500", avg: "$19,800", available: "53", turnover: "5.1%",
    engine: "2.0L NA / 1.6L Turbo 4-Cyl", horsepower: "147–201 hp", torque: "132–195 lb-ft",
    tankSize: "14.0 gal", range: "~400 mi", fuelGrade: "87 Regular", mpgCity: "31 mpg", mpgHwy: "41 mpg",
    frontBrakes: "11.0\" Ventilated Disc", rearBrakes: "9.4\" Solid Disc",
    driverAssist: "Hyundai SmartSense — FCA, LKA, BCW, HBA, DAW",
    length: "184.1\"", width: "71.9\"", height: "55.7\"", wheelbase: "107.1\"", curbWeight: "2,822 lbs",
    topSpeed: "130 mph", zeroToSixty: "8.0 s (2.0) / 7.3 s (Turbo)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "14.2 cu ft",
    insurance: "$1,000–$1,300 / yr", maintenance: "~$380 / yr",
  },
  {
    searchId: "nissan-altima", model: "Nissan Altima", preference: "#7", tracking: "Paused",
    lowEnd: "$20,400", highEnd: "$27,100", avg: "$23,600", available: "44", turnover: "3.3%",
    engine: "2.5L NA / 2.0L VC-Turbo 4-Cyl", horsepower: "182–248 hp", torque: "178–273 lb-ft",
    tankSize: "16.2 gal", range: "~480 mi", fuelGrade: "87 Regular", mpgCity: "28 mpg", mpgHwy: "39 mpg",
    frontBrakes: "11.7\" Ventilated Disc", rearBrakes: "11.5\" Solid Disc",
    driverAssist: "Nissan Safety Shield 360 — AEB, BSW, RCTW, Lane Intervention",
    length: "192.9\"", width: "72.9\"", height: "57.9\"", wheelbase: "111.2\"", curbWeight: "3,212 lbs",
    topSpeed: "130 mph", zeroToSixty: "7.4 s (2.5) / 6.2 s (VC-Turbo)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "15.4 cu ft",
    insurance: "$1,100–$1,450 / yr", maintenance: "~$500 / yr",
  },
  {
    searchId: "kia-forte", model: "Kia Forte", preference: "#8", tracking: "Active",
    lowEnd: "$16,900", highEnd: "$21,300", avg: "$18,900", available: "31", turnover: "4.7%",
    engine: "2.0L NA / 1.6L Turbo 4-Cyl", horsepower: "147–201 hp", torque: "132–195 lb-ft",
    tankSize: "13.2 gal", range: "~380 mi", fuelGrade: "87 Regular", mpgCity: "31 mpg", mpgHwy: "41 mpg",
    frontBrakes: "11.0\" Ventilated Disc", rearBrakes: "9.4\" Solid Disc",
    driverAssist: "Kia Drive Wise — FCA, LKA, BCW, DAW, HBA",
    length: "182.7\"", width: "70.9\"", height: "56.5\"", wheelbase: "104.7\"", curbWeight: "2,866 lbs",
    topSpeed: "130 mph", zeroToSixty: "8.4 s (2.0) / 6.5 s (GT)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "15.3 cu ft",
    insurance: "$950–$1,250 / yr", maintenance: "~$370 / yr",
  },
  {
    searchId: "toyota-corolla", model: "Toyota Corolla", preference: "#9", tracking: "Active",
    lowEnd: "$19,200", highEnd: "$25,800", avg: "$22,400", available: "72", turnover: "4.0%",
    engine: "2.0L NA 4-Cyl / 1.8L Hybrid", horsepower: "169–206 hp", torque: "140–151 lb-ft",
    tankSize: "13.2 gal", range: "~420 mi", fuelGrade: "87 Regular", mpgCity: "30 mpg", mpgHwy: "38 mpg",
    frontBrakes: "10.9\" Ventilated Disc", rearBrakes: "10.2\" Solid Disc",
    driverAssist: "Toyota Safety Sense 2.0 — Pre-Collision, LDA, ACC, AHB",
    length: "182.5\"", width: "70.1\"", height: "56.5\"", wheelbase: "103.9\"", curbWeight: "3,150 lbs",
    topSpeed: "130 mph", zeroToSixty: "7.5 s", nurburgring: "N/A",
    passengers: "5", cargoVolume: "13.1 cu ft",
    insurance: "$1,050–$1,350 / yr", maintenance: "~$430 / yr",
  },
  {
    searchId: "honda-accord", model: "Honda Accord", preference: "#10", tracking: "Watch",
    lowEnd: "$23,100", highEnd: "$30,400", avg: "$26,700", available: "55", turnover: "2.6%",
    engine: "1.5L Turbo / 2.0L Turbo 4-Cyl", horsepower: "192–252 hp", torque: "192–273 lb-ft",
    tankSize: "14.8 gal", range: "~420 mi", fuelGrade: "87 Regular (93 for 2.0T)", mpgCity: "30 mpg", mpgHwy: "38 mpg",
    frontBrakes: "12.3\" Ventilated Disc", rearBrakes: "11.1\" Ventilated Disc",
    driverAssist: "Honda Sensing — ACC, LKAS, CMBS, RDM",
    length: "195.7\"", width: "73.3\"", height: "57.1\"", wheelbase: "111.4\"", curbWeight: "3,131 lbs",
    topSpeed: "143 mph", zeroToSixty: "7.3 s (1.5T) / 5.5 s (2.0T)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "16.7 cu ft",
    insurance: "$1,150–$1,500 / yr", maintenance: "~$450 / yr",
  },
  {
    searchId: "mazda-3", model: "Mazda 3", preference: "#11", tracking: "Active",
    lowEnd: "$20,500", highEnd: "$27,200", avg: "$23,800", available: "36", turnover: "3.5%",
    engine: "2.0L NA / 2.5L NA / 2.5L Turbo 4-Cyl", horsepower: "155–227 hp", torque: "150–310 lb-ft",
    tankSize: "13.2 gal", range: "~380 mi", fuelGrade: "87 Regular (93 for Turbo)", mpgCity: "27 mpg", mpgHwy: "36 mpg",
    frontBrakes: "11.6\" Ventilated Disc", rearBrakes: "10.9\" Solid Disc",
    driverAssist: "Mazda i-Activsense — MRCC, LAS, SCBS, RVM, DAA",
    length: "183.5\"", width: "70.7\"", height: "57.1\"", wheelbase: "107.3\"", curbWeight: "3,040 lbs",
    topSpeed: "130 mph", zeroToSixty: "7.2 s (2.5) / 5.9 s (Turbo)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "13.6 cu ft",
    insurance: "$1,100–$1,400 / yr", maintenance: "~$480 / yr",
  },
  {
    searchId: "subaru-impreza", model: "Subaru Impreza", preference: "#12", tracking: "Watch",
    lowEnd: "$21,700", highEnd: "$28,900", avg: "$25,100", available: "27", turnover: "2.2%",
    engine: "2.0L Boxer 4-Cyl", horsepower: "152 hp", torque: "145 lb-ft",
    tankSize: "14.5 gal", range: "~400 mi", fuelGrade: "87 Regular", mpgCity: "28 mpg", mpgHwy: "36 mpg",
    frontBrakes: "11.0\" Ventilated Disc", rearBrakes: "10.9\" Solid Disc",
    driverAssist: "Subaru EyeSight — ACC, Pre-Collision, Lane Keep, Sway Warning",
    length: "181.1\"", width: "70.9\"", height: "59.1\"", wheelbase: "104.9\"", curbWeight: "3,109 lbs",
    topSpeed: "117 mph", zeroToSixty: "9.0 s", nurburgring: "N/A",
    passengers: "5", cargoVolume: "12.3 cu ft",
    insurance: "$1,200–$1,600 / yr", maintenance: "~$560 / yr",
  },
  {
    searchId: "hyundai-sonata", model: "Hyundai Sonata", preference: "#13", tracking: "Paused",
    lowEnd: "$22,300", highEnd: "$29,700", avg: "$25,900", available: "48", turnover: "1.8%",
    engine: "2.5L NA / 1.6T / 2.5T N Line", horsepower: "191–290 hp", torque: "181–311 lb-ft",
    tankSize: "15.9 gal", range: "~460 mi", fuelGrade: "87 Regular (91 for N Line)", mpgCity: "28 mpg", mpgHwy: "38 mpg",
    frontBrakes: "12.6\" Ventilated Disc", rearBrakes: "11.4\" Solid Disc",
    driverAssist: "Hyundai SmartSense — FCA, LKA, BCW, HBA, DAW",
    length: "192.9\"", width: "73.2\"", height: "56.9\"", wheelbase: "111.8\"", curbWeight: "3,210 lbs",
    topSpeed: "130 mph (155 N Line)", zeroToSixty: "7.5 s / 5.9 s (N Line)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "16.0 cu ft",
    insurance: "$1,100–$1,450 / yr", maintenance: "~$440 / yr",
  },
  {
    searchId: "chevrolet-malibu", model: "Chevrolet Malibu", preference: "#14", tracking: "Paused",
    lowEnd: "$18,800", highEnd: "$24,500", avg: "$21,500", available: "22", turnover: "1.5%",
    engine: "1.5L Turbo / 2.0L Turbo 4-Cyl", horsepower: "160–250 hp", torque: "184–258 lb-ft",
    tankSize: "15.8 gal", range: "~430 mi", fuelGrade: "87 Regular", mpgCity: "29 mpg", mpgHwy: "36 mpg",
    frontBrakes: "12.0\" Ventilated Disc", rearBrakes: "11.0\" Solid Disc",
    driverAssist: "Chevy Safety Assist — AEB, LKA, FCW, Rear Cross Traffic",
    length: "193.8\"", width: "72.8\"", height: "57.4\"", wheelbase: "111.4\"", curbWeight: "3,070 lbs",
    topSpeed: "130 mph", zeroToSixty: "8.3 s (1.5T) / 6.4 s (2.0T)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "15.8 cu ft",
    insurance: "$1,050–$1,400 / yr", maintenance: "~$580 / yr",
  },
  {
    searchId: "ford-fusion", model: "Ford Fusion", preference: "#15", tracking: "Active",
    lowEnd: "$17,400", highEnd: "$23,100", avg: "$20,100", available: "19", turnover: "3.9%",
    engine: "1.5L / 2.0L EcoBoost / 2.7L EcoBoost / Hybrid", horsepower: "181–325 hp", torque: "185–350 lb-ft",
    tankSize: "16.5 gal", range: "~420 mi", fuelGrade: "87 Regular", mpgCity: "23 mpg", mpgHwy: "34 mpg",
    frontBrakes: "12.4\" Ventilated Disc", rearBrakes: "11.1\" Solid Disc",
    driverAssist: "Ford Co-Pilot360 — AEB, LKA, ACC, Blind Spot Assist",
    length: "191.8\"", width: "72.9\"", height: "58.2\"", wheelbase: "112.2\"", curbWeight: "3,397 lbs",
    topSpeed: "140 mph", zeroToSixty: "7.5 s (2.0) / 5.5 s (2.7 Sport)", nurburgring: "N/A",
    passengers: "5", cargoVolume: "16.0 cu ft",
    insurance: "$1,100–$1,450 / yr", maintenance: "~$600 / yr",
  },
];

type SpecRow = { label: string; getValue: (c: Car) => string };
type SpecSection = { title: string; rows: SpecRow[] };

const SPEC_SECTIONS: SpecSection[] = [
  {
    title: "Market Values",
    rows: [
      { label: "Price range",       getValue: (c) => `${c.lowEnd} – ${c.highEnd}` },
      { label: "Average asking",    getValue: (c) => c.avg },
      { label: "Listings",          getValue: (c) => `${c.available} available` },
      { label: "Turnover rate",     getValue: (c) => c.turnover },
      { label: "Status",            getValue: (c) => c.tracking },
    ],
  },
  {
    title: "Engine & Power",
    rows: [
      { label: "Engine",     getValue: (c) => c.engine },
      { label: "Horsepower", getValue: (c) => c.horsepower },
      { label: "Torque",     getValue: (c) => c.torque },
    ],
  },
  {
    title: "Fuel & Range",
    rows: [
      { label: "Tank size",    getValue: (c) => c.tankSize },
      { label: "Est. range",   getValue: (c) => c.range },
      { label: "Fuel grade",   getValue: (c) => c.fuelGrade },
      { label: "City MPG",     getValue: (c) => c.mpgCity },
      { label: "Highway MPG",  getValue: (c) => c.mpgHwy },
    ],
  },
  {
    title: "Brakes",
    rows: [
      { label: "Front", getValue: (c) => c.frontBrakes },
      { label: "Rear",  getValue: (c) => c.rearBrakes },
    ],
  },
  {
    title: "Driver Assistance",
    rows: [
      { label: "System & features", getValue: (c) => c.driverAssist },
    ],
  },
  {
    title: "Dimensions & Weight",
    rows: [
      { label: "Length",      getValue: (c) => c.length },
      { label: "Width",       getValue: (c) => c.width },
      { label: "Height",      getValue: (c) => c.height },
      { label: "Wheelbase",   getValue: (c) => c.wheelbase },
      { label: "Curb weight", getValue: (c) => c.curbWeight },
    ],
  },
  {
    title: "Performance",
    rows: [
      { label: "Top speed",    getValue: (c) => c.topSpeed },
      { label: "0–60 mph",     getValue: (c) => c.zeroToSixty },
      { label: "Nürburgring",  getValue: (c) => c.nurburgring },
    ],
  },
  {
    title: "Capacity",
    rows: [
      { label: "Passengers",   getValue: (c) => c.passengers },
      { label: "Cargo volume", getValue: (c) => c.cargoVolume },
    ],
  },
  {
    title: "Ownership Costs",
    rows: [
      { label: "Avg insurance",   getValue: (c) => c.insurance },
      { label: "Avg maintenance", getValue: (c) => c.maintenance },
    ],
  },
];

type SlotState = Car | "picking" | null;

export default function ComparePage() {
  const [slots, setSlots] = useState<[SlotState, SlotState, SlotState]>([null, null, null]);

  function takenIds(): Set<string> {
    return new Set(
      slots
        .filter((s): s is Car => s !== null && s !== "picking")
        .map((s) => s.searchId),
    );
  }

  function openPicker(i: 0 | 1 | 2) {
    setSlots((prev) => {
      const next = [...prev] as [SlotState, SlotState, SlotState];
      next[i] = "picking";
      return next;
    });
  }

  function selectCar(i: 0 | 1 | 2, car: Car) {
    setSlots((prev) => {
      const next = [...prev] as [SlotState, SlotState, SlotState];
      next[i] = car;
      return next;
    });
  }

  function clearSlot(i: 0 | 1 | 2) {
    setSlots((prev) => {
      const next = [...prev] as [SlotState, SlotState, SlotState];
      next[i] = null;
      return next;
    });
  }

  const taken = takenIds();
  const hasAnyCar = slots.some((s) => s !== null && s !== "picking");

  return (
    <main className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Compare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select up to 3 cars from your list to compare side-by-side.
        </p>
      </div>

      {/* ── Slot selectors ── */}
      <div className="grid grid-cols-3 gap-4">
        {([0, 1, 2] as const).map((i) => {
          const slot = slots[i];

          if (slot === null) {
            return (
              <button
                key={i}
                onClick={() => openPicker(i)}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-foreground/20 p-12 text-foreground/30 hover:border-foreground/40 hover:text-foreground/60 transition-colors w-full"
              >
                <Plus className="h-10 w-10" strokeWidth={1.5} />
                <span className="text-sm font-medium">Add a car</span>
              </button>
            );
          }

          if (slot === "picking") {
            const available = CAR_LIST.filter((c) => !taken.has(c.searchId));
            return (
              <div key={i} className="rounded-xl border overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                  <span className="text-sm font-semibold">Choose a car</span>
                  <button
                    onClick={() => clearSlot(i)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-64 flex flex-col">
                  {available.map((car) => (
                    <button
                      key={car.searchId}
                      onClick={() => selectCar(i, car)}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center justify-between gap-4 border-b last:border-0"
                    >
                      <span className="font-medium text-sm">{car.model}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {car.preference}
                      </span>
                    </button>
                  ))}
                  {available.length === 0 && (
                    <p className="px-4 py-8 text-sm text-muted-foreground text-center">
                      All cars selected.
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="rounded-xl border px-4 py-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{slot.model}</p>
                <p className="text-xs text-muted-foreground">{slot.preference} · {slot.tracking}</p>
              </div>
              <button
                onClick={() => clearSlot(i)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Comparison grid ── */}
      {hasAnyCar && (
        <div className="rounded-xl border overflow-hidden">
          <div className="grid grid-cols-[200px_1fr_1fr_1fr]">

            {/* Column header row */}
            <div className="px-4 py-3 bg-muted/40 border-b" />
            {([0, 1, 2] as const).map((i) => {
              const slot = slots[i];
              const car = slot !== null && slot !== "picking" ? slot : null;
              return (
                <div key={i} className="px-4 py-3 bg-muted/40 border-b border-l">
                  {car ? (
                    <>
                      <p className="font-semibold text-sm">{car.model}</p>
                      <p className="text-xs text-muted-foreground">{car.preference} · {car.tracking}</p>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground/40">—</span>
                  )}
                </div>
              );
            })}

            {/* Section + row cells */}
            {SPEC_SECTIONS.flatMap((section, si) => [
              <div
                key={`s-${si}`}
                className="col-span-4 px-4 py-2 bg-muted/30 border-b"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {section.title}
                </span>
              </div>,
              ...section.rows.flatMap((row, ri) => [
                <div
                  key={`s${si}-r${ri}-l`}
                  className={cn(
                    "px-4 py-2.5 text-sm text-muted-foreground border-b",
                    ri % 2 === 1 && "bg-muted/10",
                  )}
                >
                  {row.label}
                </div>,
                ...([0, 1, 2] as const).map((ci) => {
                  const slot = slots[ci];
                  const car = slot !== null && slot !== "picking" ? slot : null;
                  return (
                    <div
                      key={`s${si}-r${ri}-c${ci}`}
                      className={cn(
                        "px-4 py-2.5 text-sm border-b border-l",
                        ri % 2 === 1 && "bg-muted/10",
                      )}
                    >
                      {car ? (
                        row.getValue(car)
                      ) : (
                        <span className="text-muted-foreground/25">—</span>
                      )}
                    </div>
                  );
                }),
              ]),
            ])}
          </div>
        </div>
      )}
    </main>
  );
}

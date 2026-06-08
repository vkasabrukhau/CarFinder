"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Static search data ────────────────────────────────────────────────────────

const searchData: Record<
  string,
  {
    brand: string;
    model: string;
    lowEnd: string;
    highEnd: string;
    avg: string;
    toReview: string;
    tracking: string;
    available: string;
    preference: string;
    turnover: string;
    filters: {
      trims: string;
      years: string;
      mileage: string;
      price: string;
    };
  }
> = {
  "honda-civic": {
    brand: "Honda",
    model: "Honda Civic",
    lowEnd: "$18,500",
    highEnd: "$23,900",
    avg: "$21,200",
    toReview: "12",
    tracking: "Active",
    available: "84",
    preference: "#1",
    turnover: "4.2%",
    filters: { trims: "EX, Sport, Touring", years: "2018–2022", mileage: "20k–70k mi", price: "$18k–$24k" },
  },
  "toyota-camry": {
    brand: "Toyota",
    model: "Toyota Camry",
    lowEnd: "$21,000",
    highEnd: "$28,600",
    avg: "$24,750",
    toReview: "8",
    tracking: "Active",
    available: "67",
    preference: "#2",
    turnover: "3.8%",
    filters: { trims: "LE, XLE, SE", years: "2019–2023", mileage: "15k–60k mi", price: "$21k–$29k" },
  },
  "mazda-cx-5": {
    brand: "Mazda",
    model: "Mazda CX-5",
    lowEnd: "$24,300",
    highEnd: "$32,100",
    avg: "$28,100",
    toReview: "5",
    tracking: "Watch",
    available: "41",
    preference: "#3",
    turnover: "2.9%",
    filters: { trims: "Sport, Touring, Grand Touring", years: "2019–2023", mileage: "10k–50k mi", price: "$24k–$32k" },
  },
  "subaru-outback": {
    brand: "Subaru",
    model: "Subaru Outback",
    lowEnd: "$26,900",
    highEnd: "$35,750",
    avg: "$30,800",
    toReview: "11",
    tracking: "Active",
    available: "38",
    preference: "#4",
    turnover: "3.1%",
    filters: { trims: "Base, Premium, Limited", years: "2018–2022", mileage: "25k–75k mi", price: "$27k–$36k" },
  },
  "vw-jetta": {
    brand: "VW",
    model: "VW Jetta",
    lowEnd: "$19,800",
    highEnd: "$26,400",
    avg: "$22,900",
    toReview: "6",
    tracking: "Watch",
    available: "29",
    preference: "#5",
    turnover: "2.4%",
    filters: { trims: "S, SE, SEL", years: "2019–2022", mileage: "20k–65k mi", price: "$20k–$26k" },
  },
  "hyundai-elantra": {
    brand: "Hyundai",
    model: "Hyundai Elantra",
    lowEnd: "$17,200",
    highEnd: "$22,500",
    avg: "$19,800",
    toReview: "9",
    tracking: "Active",
    available: "53",
    preference: "#6",
    turnover: "5.1%",
    filters: { trims: "SE, SEL, N Line", years: "2019–2023", mileage: "15k–55k mi", price: "$17k–$23k" },
  },
  "nissan-altima": {
    brand: "Nissan",
    model: "Nissan Altima",
    lowEnd: "$20,400",
    highEnd: "$27,100",
    avg: "$23,600",
    toReview: "4",
    tracking: "Paused",
    available: "44",
    preference: "#7",
    turnover: "3.3%",
    filters: { trims: "S, SV, SL", years: "2018–2022", mileage: "20k–70k mi", price: "$20k–$27k" },
  },
  "kia-forte": {
    brand: "Kia",
    model: "Kia Forte",
    lowEnd: "$16,900",
    highEnd: "$21,300",
    avg: "$18,900",
    toReview: "7",
    tracking: "Active",
    available: "31",
    preference: "#8",
    turnover: "4.7%",
    filters: { trims: "FE, LXS, GT-Line", years: "2019–2023", mileage: "15k–60k mi", price: "$17k–$21k" },
  },
  "toyota-corolla": {
    brand: "Toyota",
    model: "Toyota Corolla",
    lowEnd: "$19,200",
    highEnd: "$25,800",
    avg: "$22,400",
    toReview: "10",
    tracking: "Active",
    available: "72",
    preference: "#9",
    turnover: "4.0%",
    filters: { trims: "L, LE, XLE", years: "2019–2023", mileage: "10k–60k mi", price: "$19k–$26k" },
  },
  "honda-accord": {
    brand: "Honda",
    model: "Honda Accord",
    lowEnd: "$23,100",
    highEnd: "$30,400",
    avg: "$26,700",
    toReview: "3",
    tracking: "Watch",
    available: "55",
    preference: "#10",
    turnover: "2.6%",
    filters: { trims: "LX, Sport, EX-L", years: "2018–2022", mileage: "20k–65k mi", price: "$23k–$30k" },
  },
  "mazda-3": {
    brand: "Mazda",
    model: "Mazda 3",
    lowEnd: "$20,500",
    highEnd: "$27,200",
    avg: "$23,800",
    toReview: "6",
    tracking: "Active",
    available: "36",
    preference: "#11",
    turnover: "3.5%",
    filters: { trims: "Select, Preferred, Premium", years: "2019–2023", mileage: "15k–55k mi", price: "$21k–$27k" },
  },
  "subaru-impreza": {
    brand: "Subaru",
    model: "Subaru Impreza",
    lowEnd: "$21,700",
    highEnd: "$28,900",
    avg: "$25,100",
    toReview: "4",
    tracking: "Watch",
    available: "27",
    preference: "#12",
    turnover: "2.2%",
    filters: { trims: "Base, Premium, Sport", years: "2018–2022", mileage: "20k–70k mi", price: "$22k–$29k" },
  },
  "hyundai-sonata": {
    brand: "Hyundai",
    model: "Hyundai Sonata",
    lowEnd: "$22,300",
    highEnd: "$29,700",
    avg: "$25,900",
    toReview: "5",
    tracking: "Paused",
    available: "48",
    preference: "#13",
    turnover: "1.8%",
    filters: { trims: "SE, SEL, Limited", years: "2019–2022", mileage: "20k–60k mi", price: "$22k–$30k" },
  },
  "chevrolet-malibu": {
    brand: "Chevrolet",
    model: "Chevrolet Malibu",
    lowEnd: "$18,800",
    highEnd: "$24,500",
    avg: "$21,500",
    toReview: "2",
    tracking: "Paused",
    available: "22",
    preference: "#14",
    turnover: "1.5%",
    filters: { trims: "LS, RS, LT", years: "2018–2021", mileage: "25k–75k mi", price: "$19k–$25k" },
  },
  "ford-fusion": {
    brand: "Ford",
    model: "Ford Fusion",
    lowEnd: "$17,400",
    highEnd: "$23,100",
    avg: "$20,100",
    toReview: "8",
    tracking: "Active",
    available: "19",
    preference: "#15",
    turnover: "3.9%",
    filters: { trims: "S, SE, SEL", years: "2017–2020", mileage: "25k–80k mi", price: "$17k–$23k" },
  },
};

// ── Tab content placeholders ──────────────────────────────────────────────────

const activePostings = [
  { trim: "EX",      dayPosted: "Jun 6, 2026",  price: "$21,400", mileage: "38,200 mi", distance: "4.2 mi",  sellerType: "Dealership", rating: "4.7" },
  { trim: "Sport",   dayPosted: "Jun 3, 2026",  price: "$19,900", mileage: "51,000 mi", distance: "12.8 mi", sellerType: "Private",    rating: "—"   },
  { trim: "Touring", dayPosted: "Jun 7, 2026",  price: "$23,500", mileage: "22,100 mi", distance: "7.1 mi",  sellerType: "Dealership", rating: "4.2" },
  { trim: "EX-L",    dayPosted: "Jun 1, 2026",  price: "$18,700", mileage: "64,500 mi", distance: "19.4 mi", sellerType: "Private",    rating: "—"   },
  { trim: "Sport",   dayPosted: "May 29, 2026", price: "$20,300", mileage: "47,800 mi", distance: "3.6 mi",  sellerType: "Dealership", rating: "3.9" },
  { trim: "EX",      dayPosted: "May 27, 2026", price: "$22,100", mileage: "29,500 mi", distance: "24.0 mi", sellerType: "Dealership", rating: "4.5" },
];

const problems = [
  {
    issue: "Oil consumption (1.5T engine)",
    severity: "High",
    years: "2016–2019",
    frequency: "34%",
    price: "$800–$2,400",
    description: "The turbocharged 1.5L engine burns through oil between scheduled changes, often going critically low without warning. Most pronounced during highway driving and in warmer climates. Can cause premature engine wear or seizure if unmonitored.",
  },
  {
    issue: "CVT shudder under acceleration",
    severity: "Medium",
    years: "2018–2020",
    frequency: "18%",
    price: "$1,200–$3,800",
    description: "The continuously variable transmission shudders or hesitates when accelerating from a stop, particularly on inclines. Typically triggered by low CVT fluid or worn internal clutch packs. A fluid exchange often resolves early cases.",
  },
  {
    issue: "AC compressor failure",
    severity: "Medium",
    years: "2017–2021",
    frequency: "12%",
    price: "$400–$900",
    description: "The air conditioning compressor seizes prematurely, resulting in warm air and loud clicking or grinding from the engine bay. More common in high-heat regions. Usually requires full compressor replacement alongside a refrigerant recharge.",
  },
  {
    issue: "Paint peeling on roof",
    severity: "Low",
    years: "2015–2018",
    frequency: "7%",
    price: "$300–$1,200",
    description: "Clear coat separates from the roof panel, starting at the edges and spreading inward. Caused by a thin factory application combined with UV exposure. Mostly cosmetic but can lead to rust if left untreated in wet climates.",
  },
  {
    issue: "Suspension rattle (front struts)",
    severity: "Low",
    years: "2017–2020",
    frequency: "9%",
    price: "$250–$700",
    description: "Front strut mounts wear out and produce a clunking or rattling sound over bumps and uneven pavement. The noise is most noticeable at low speeds and during cold starts. Replacement is straightforward and parts are widely available.",
  },
  {
    issue: "Infotainment system freeze",
    severity: "Low",
    years: "2019–2022",
    frequency: "11%",
    price: "$0–$400",
    description: "The touchscreen and connected audio controls become unresponsive, requiring a hard reset by holding the power button. Triggered by software corruption or overheating of the head unit. Most cases are resolved by a dealer-issued firmware update.",
  },
];

const repairCosts = [
  {
    service: "Oil change",
    tier: "Routine",
    avgCost: "$45–$80",
    interval: "Every 5k–7.5k mi",
    description:
      "Standard synthetic oil and filter swap. The 1.5T engine requires 0W-20 full synthetic; conventional oil accelerates sludge buildup and worsens the known oil consumption issue.",
  },
  {
    service: "Brake pad & rotor replacement",
    tier: "Routine",
    avgCost: "$220–$380",
    interval: "Every 30k–50k mi",
    description:
      "Front pads wear faster than rear due to brake bias. OEM rotors are prone to surface rust if the car sits for extended periods — aftermarket coated rotors hold up better in wet climates.",
  },
  {
    service: "CVT fluid change",
    tier: "Routine",
    avgCost: "$150–$200",
    interval: "Every 60k mi",
    description:
      "Honda specifies HCF-2 CVT fluid exclusively. Non-OEM fluids can cause shudder even in healthy transmissions. A $150 fluid service is far cheaper than ignoring it.",
  },
  {
    service: "Spark plug replacement",
    tier: "Routine",
    avgCost: "$120–$180",
    interval: "Every 100k mi",
    description:
      "Iridium plugs last the full interval. Worn plugs cause rough idle and reduced fuel economy. The turbocharged variant requires intake manifold removal — budget extra labor time.",
  },
  {
    service: "Timing chain service",
    tier: "Expensive Maintenance",
    avgCost: "$600–$900",
    interval: "Every 120k mi",
    description:
      "Chain, tensioner, and guides should be inspected around 120k miles. Early warning is a rattle on cold starts. Deferred service risks chain stretch and potential valve contact damage.",
  },
  {
    service: "Water pump replacement",
    tier: "Expensive Maintenance",
    avgCost: "$400–$650",
    interval: "As needed",
    description:
      "Often bundled with timing chain service due to shared access. Failure causes overheating within minutes. The 1.5T variant uses an electric water pump that can fail independently of the auxiliary pump.",
  },
  {
    service: "Transmission replacement (CVT)",
    tier: "Expensive Parts",
    avgCost: "$3,500–$5,200",
    interval: "As needed",
    description:
      "Full CVT replacement is required when internal clutch packs or the belt assembly fail beyond fluid service recovery. Remanufactured units are available at the lower end of the cost range.",
  },
  {
    service: "Engine short block replacement",
    tier: "Expensive Parts",
    avgCost: "$4,800–$7,500",
    interval: "As needed",
    description:
      "Required when the 1.5T suffers catastrophic oil starvation damage — symptoms include rod knock and total loss of oil pressure. Most at risk on 2016–2019 models that were not monitored closely.",
  },
];

const insuranceCard = {
  coverage: ["Collision", "Comprehensive", "Liability", "Uninsured Motorist", "Medical Payments", "Roadside Assistance"],
  annualEstimate: "$1,044–$1,344 / yr",
  monthlyEstimate: "$87–$112 / mo",
};

const extendedWarranty = {
  coverage: ["Powertrain", "Electrical Systems", "A/C & Heating", "Fuel System", "Seals & Gaskets"],
  duration: "Up to 8 yrs / 120k mi",
  estimatedCost: "$1,200–$2,800",
  description:
    "Extended coverage picks up where the factory warranty left off. Honda Care plans must be purchased before the factory warranty expires; third-party options remain available after that window.",
};

const oemWarranty = {
  basic: "3 yrs / 36k mi — Bumper to Bumper",
  powertrain: "5 yrs / 60k mi — Powertrain",
  description:
    "For 2018–2022 models with 20k–70k miles, the original bumper-to-bumper warranty has fully lapsed. Powertrain coverage may still apply to lower-mileage 2021–2022 examples.",
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  "Active Postings",
  "Problems",
  "Repair / Maintenance Costs",
  "Insurance / Warranty Details",
] as const;

type Tab = (typeof TABS)[number];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SearchPage({
  params,
}: {
  params: Promise<{ username: string; searchId: string }>;
}) {
  const { searchId } = use(params);
  const router = useRouter();
  const data = searchData[searchId];
  const [activeTab, setActiveTab] = useState<Tab>("Active Postings");

  if (!data) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Search not found.</p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 p-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-5">
        <Card className="shrink-0 h-20 w-20 overflow-hidden">
          <CardContent className="flex h-full w-full items-center justify-center p-0">
            <span className="text-3xl font-bold text-muted-foreground select-none">
              {data.brand[0]}
            </span>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-semibold leading-none">{data.model}</h1>
          <p className="text-sm text-muted-foreground">
            {data.preference} preference · {data.tracking}
          </p>
        </div>
      </div>

      {/* ── Filter tags ── */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">Trims: {data.filters.trims}</Badge>
        <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">Years: {data.filters.years}</Badge>
        <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">Mileage: {data.filters.mileage}</Badge>
        <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">Price: {data.filters.price}</Badge>
      </div>

      {/* ── Tab nav ── */}
      <div className="flex flex-col gap-0">
        <div className="flex gap-0 border-b">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab panels ── */}
        <div className="pt-4">
          {activeTab === "Active Postings" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trim</TableHead>
                  <TableHead>Day Posted</TableHead>
                  <TableHead>Price Listed</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Distance Away</TableHead>
                  <TableHead>Seller Type</TableHead>
                  <TableHead>Dealer Rating</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePostings.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.trim}</TableCell>
                    <TableCell className="text-muted-foreground">{row.dayPosted}</TableCell>
                    <TableCell className="tabular-nums font-medium">{row.price}</TableCell>
                    <TableCell className="tabular-nums">{row.mileage}</TableCell>
                    <TableCell className="tabular-nums">{row.distance}</TableCell>
                    <TableCell>{row.sellerType}</TableCell>
                    <TableCell className="tabular-nums">{row.rating}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline">Track</Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground">Dismiss</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "Problems" && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {problems.map((row) => {
                const isHigh = row.severity === "High";
                const isMedium = row.severity === "Medium";
                const bg = isHigh ? "#C73838" : isMedium ? "#DBB900" : "#383838";
                const tagCls = isMedium
                  ? "bg-black/15 text-[#1a1a1a]"
                  : "bg-white/20 text-white";
                return (
                  <div
                    key={row.issue}
                    className="rounded-xl p-4 flex flex-col gap-2.5"
                    style={{ backgroundColor: bg }}
                  >
                    <p
                      className={cn(
                        "text-lg font-semibold leading-snug",
                        isMedium ? "text-[#1a1a1a]" : "text-white",
                      )}
                    >
                      {row.issue}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tagCls)}>
                        {row.price}
                      </span>
                      <span className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tagCls)}>
                        {row.frequency} frequency
                      </span>
                      <span className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tagCls)}>
                        {row.years}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        isMedium ? "text-[#2a2a2a]" : "text-white/80",
                      )}
                    >
                      {row.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "Repair / Maintenance Costs" && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {repairCosts.map((row) => {
                const isExpensive = row.tier === "Expensive Parts";
                const isMid = row.tier === "Expensive Maintenance";
                const bg = isExpensive ? "#C73838" : isMid ? "#DBB900" : "#383838";
                const tagCls = isMid
                  ? "bg-black/15 text-[#1a1a1a]"
                  : "bg-white/20 text-white";
                return (
                  <div
                    key={row.service}
                    className="rounded-xl p-4 flex flex-col gap-2.5"
                    style={{ backgroundColor: bg }}
                  >
                    <p
                      className={cn(
                        "text-lg font-semibold leading-snug",
                        isMid ? "text-[#1a1a1a]" : "text-white",
                      )}
                    >
                      {row.service}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tagCls)}>
                        {row.avgCost}
                      </span>
                      <span className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tagCls)}>
                        {row.interval}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        isMid ? "text-[#2a2a2a]" : "text-white/80",
                      )}
                    >
                      {row.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "Insurance / Warranty Details" && (
            <div className="flex flex-col gap-4">
              {/* Insurance — dark green */}
              <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: "#1B4332" }}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-xl font-semibold text-white">Insurance</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-white tabular-nums">{insuranceCard.annualEstimate}</span>
                    <span className="text-sm text-white/60 tabular-nums">{insuranceCard.monthlyEstimate}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insuranceCard.coverage.map((item) => (
                    <span key={item} className="rounded-md px-3 py-1.5 text-sm font-medium bg-white/15 text-white">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Extended Warranty — dark gray */}
              <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: "#2A2A2A" }}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-xl font-semibold text-white">Extended Warranty</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-white tabular-nums">{extendedWarranty.estimatedCost}</span>
                    <span className="text-sm text-white/50">{extendedWarranty.duration}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {extendedWarranty.coverage.map((item) => (
                    <span key={item} className="rounded-md px-3 py-1.5 text-sm font-medium bg-white/15 text-white">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white/70">{extendedWarranty.description}</p>
              </div>

              {/* OEM Warranty — expired, light gray dashed */}
              <div className="rounded-xl p-5 flex flex-col gap-4 border-2 border-dashed border-[#c8c8c8] bg-[#f5f5f5]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xl font-semibold text-[#555]">Original Manufacturer Warranty</p>
                  <span className="rounded-md px-3 py-1.5 text-sm font-semibold bg-[#e0e0e0] text-[#888]">
                    Expired
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md px-3 py-1.5 text-sm font-medium bg-[#e5e5e5] text-[#777] line-through">
                    {oemWarranty.basic}
                  </span>
                  <span className="rounded-md px-3 py-1.5 text-sm font-medium bg-[#e5e5e5] text-[#777] line-through">
                    {oemWarranty.powertrain}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#888]">{oemWarranty.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

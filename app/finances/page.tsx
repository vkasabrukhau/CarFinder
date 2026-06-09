"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Plus, Minus } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Types & constants ─────────────────────────────────────────────────────────

type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
type Job = { label: string; wage: number; hoursPerWeek: number };
type ExpenseKey = "housing" | "utilities" | "groceries" | "health" | "gas" | "other";

const EXPENSE_LABELS: Record<ExpenseKey, string> = {
  housing:   "Housing (rent/mortgage)",
  utilities: "Utilities",
  groceries: "Groceries & Food",
  health:    "Health Insurance",
  gas:       "Gas & Transportation",
  other:     "Other",
};

const FREQ_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: "weekly",       label: "Weekly"       },
  { value: "biweekly",    label: "Bi-Weekly"    },
  { value: "semimonthly", label: "Semi-Monthly" },
  { value: "monthly",     label: "Monthly"      },
];

const TERM_OPTIONS = [12, 24, 36, 48, 60, 72];

const RETURN_PRESETS = [
  { label: "Conservative", value: 4 },
  { label: "Moderate",     value: 7 },
  { label: "Aggressive",   value: 10 },
];

const ALLOC_PRESETS = [25, 50, 75, 100];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  });
}

function monthlyGrossFromJobs(jobs: Job[]) {
  return jobs.reduce((sum, j) => sum + j.wage * j.hoursPerWeek, 0) * 52 / 12;
}

function calcMonthlyPayment(principal: number, aprPct: number, term: number) {
  if (principal <= 0 || term <= 0) return 0;
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / term;
  return principal * (r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
}

function perPaycheck(monthlyGross: number, freq: PayFrequency) {
  const periods: Record<PayFrequency, number> = {
    weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12,
  };
  return (monthlyGross * 12) / periods[freq];
}

function fmtAxis(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  return `${sign}$${abs}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: "green" | "red" | "yellow";
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "mt-0.5 text-lg font-semibold tabular-nums",
        highlight === "green"  && "text-green-600",
        highlight === "red"    && "text-red-500",
        highlight === "yellow" && "text-yellow-600",
      )}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function MoneyInput({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pl-6"
        />
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total    = payload.find((p) => p.name === "Total w/ Investments")?.value ?? 0;
  const savings  = payload.find((p) => p.name === "Savings")?.value ?? 0;
  const gains    = Math.max(0, total - savings);

  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 shadow-md text-sm space-y-1 min-w-52">
      <p className="text-xs font-semibold text-muted-foreground pb-1 border-b mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full shrink-0 bg-green-500" />
        <span className="text-muted-foreground text-xs">Cash savings</span>
        <span className="ml-auto font-medium tabular-nums text-xs">{fmt(savings)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full shrink-0 bg-blue-500" />
        <span className="text-muted-foreground text-xs">Investment portfolio</span>
        <span className="ml-auto font-medium tabular-nums text-xs text-blue-600">{fmt(gains)}</span>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t mt-1">
        <span className="inline-block h-2 w-2 rounded-full shrink-0 bg-foreground/30" />
        <span className="text-muted-foreground text-xs font-medium">Total net worth</span>
        <span className="ml-auto font-medium tabular-nums text-xs">{fmt(total)}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  // ── Income ────────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([
    { label: "Job 1", wage: 22, hoursPerWeek: 40 },
  ]);
  const [frequency, setFrequency] = useState<PayFrequency>("biweekly");

  function addJob() {
    if (jobs.length >= 3) return;
    setJobs((p) => [...p, { label: `Job ${p.length + 1}`, wage: 18, hoursPerWeek: 20 }]);
  }
  function removeJob() {
    if (jobs.length <= 1) return;
    setJobs((p) => p.slice(0, -1));
  }
  function updateJob(i: number, field: keyof Omit<Job, "label">, raw: string) {
    setJobs((p) => p.map((j, idx) => idx === i ? { ...j, [field]: parseFloat(raw) || 0 } : j));
  }

  // ── Expenses ──────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Record<ExpenseKey, number>>({
    housing: 1200, utilities: 150, groceries: 400,
    health: 200,  gas: 100,       other: 150,
  });

  // ── Investments ───────────────────────────────────────────────────────────
  const [investPct,    setInvestPct]    = useState(20);   // % of monthly savings to invest
  const [annualReturn, setAnnualReturn] = useState(7.0);  // expected annual return %

  // ── Loan ──────────────────────────────────────────────────────────────────
  const [vehiclePrice, setVehiclePrice] = useState(22000);
  const [downPayment,  setDownPayment]  = useState(3000);
  const [apr,          setApr]          = useState(6.5);
  const [termMonths,   setTermMonths]   = useState(60);

  // ── Derived ───────────────────────────────────────────────────────────────
  const monthlyGross  = useMemo(() => monthlyGrossFromJobs(jobs), [jobs]);
  const monthlyNet    = monthlyGross * 0.75;
  const totalExpenses = useMemo(
    () => Object.values(expenses).reduce((s, v) => s + v, 0), [expenses],
  );
  const principal      = Math.max(0, vehiclePrice - downPayment);
  const monthlyPayment = useMemo(
    () => calcMonthlyPayment(principal, apr, termMonths),
    [principal, apr, termMonths],
  );
  const monthlySavings = monthlyNet - totalExpenses - monthlyPayment;

  // Investment contribution only comes from surplus — can't invest what you don't have
  const monthlyContrib = Math.max(0, monthlySavings) * (investPct / 100);
  const monthlyCash    = monthlySavings - monthlyContrib;

  const totalPaid     = monthlyPayment * termMonths;
  const totalInterest = totalPaid - principal;
  const payoffDate    = useMemo(() => {
    const d = new Date(2026, 5 + termMonths, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }, [termMonths]);

  // ── Chart data ────────────────────────────────────────────────────────────
  // Two series:
  //  "Savings"              — cash balance only (linear, same slope every month)
  //  "Total w/ Investments" — cash + investment portfolio (curves upward via compounding)
  //
  // Rendered with Total behind and Savings in front. The blue area visible above
  // the green/red line is the investment portfolio — it widens as compounding kicks in.
  const chartData = useMemo(() => {
    let cash = 0;
    let portfolio = 0;
    const monthlyRate = annualReturn / 100 / 12;

    return Array.from({ length: 25 }, (_, i) => {
      const d = new Date(2026, 5 + i, 1);
      const point = {
        month: d.toLocaleString("default", { month: "short", year: "2-digit" }),
        "Savings":              Math.round(cash),
        "Total w/ Investments": Math.round(cash + portfolio),
      };
      cash      += monthlyCash;
      portfolio  = portfolio * (1 + monthlyRate) + monthlyContrib;
      return point;
    });
  }, [monthlyCash, monthlyContrib, annualReturn]);

  // Projected 24-month portfolio value (last point)
  const projectedPortfolio = chartData[chartData.length - 1]["Total w/ Investments"] -
                             chartData[chartData.length - 1]["Savings"];
  const projectedTotal     = chartData[chartData.length - 1]["Total w/ Investments"];

  const inSurplus      = monthlySavings >= 0;
  const cashColor      = inSurplus ? "#22c55e" : "#ef4444";
  const savingsHL      = monthlySavings > 0 ? "green" : monthlySavings < 0 ? "red" : undefined;
  const ptiRatio       = monthlyNet > 0 ? monthlyPayment / monthlyNet : 0;

  const expenseColors  = ["bg-blue-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-purple-500","bg-slate-400"];

  return (
    <main className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Finances</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your income, expenses, and investments — then see your projected savings trajectory.
        </p>
      </div>

      {/* ── 1. Projected Savings Graph ── */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Savings</CardTitle>
          <CardDescription>
            24-month outlook — cash savings (green) with investment portfolio growth layered on top (blue).
            The widening gap above the green line is compound returns.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">

          {/* Summary pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Stat label="Monthly savings"       value={fmt(monthlySavings)}      highlight={savingsHL} />
            <Stat label="Invested / mo"         value={fmt(monthlyContrib)}      sub={`${investPct}% of savings`} />
            <Stat label="Cash kept / mo"        value={fmt(monthlyCash)}         />
            <Stat label="24-mo portfolio"       value={fmt(projectedPortfolio)}  sub={`${annualReturn}% annual return`} />
            <Stat label="24-mo total"           value={fmt(projectedTotal)}      highlight={projectedTotal > 0 ? "green" : "red"} />
          </div>

          {monthlySavings < 0 && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
              ⚠ Expenses + loan ({fmt(totalExpenses + monthlyPayment)}) exceed take-home ({fmt(monthlyNet)}). No investment contributions until this is resolved.
            </div>
          )}

          {/* Chart — Total behind, Savings in front */}
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {/* Blue: total (cash + investments) */}
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.04} />
                </linearGradient>
                {/* Green/red: cash savings */}
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cashColor} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={cashColor} stopOpacity={0.08} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtAxis}
                width={52}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="4 4" />

              {/* Total w/ investments — drawn first so it sits behind cash */}
              <Area
                type="monotone"
                dataKey="Total w/ Investments"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#totalGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />

              {/* Cash savings — drawn on top; blue "peeks" above this line = investments */}
              <Area
                type="linear"
                dataKey="Savings"
                stroke={cashColor}
                strokeWidth={2.5}
                fill="url(#cashGrad)"
                dot={false}
                activeDot={{ r: 4, fill: cashColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span>Cash savings (linear)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Total incl. investments (compound curve)</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-muted-foreground/60">Gap = investment portfolio value</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Income · Expenses · Investments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Income */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Income</CardTitle>
                <CardDescription className="mt-1">Jobs, wages, pay schedule.</CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">Jobs</span>
                <div className="flex items-center rounded-lg border overflow-hidden">
                  <button onClick={removeJob} disabled={jobs.length <= 1}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors disabled:opacity-30">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold tabular-nums border-x">{jobs.length}</span>
                  <button onClick={addJob} disabled={jobs.length >= 3}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors disabled:opacity-30">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Pay frequency */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Pay Frequency</Label>
              <div className="flex rounded-lg border overflow-hidden text-sm">
                {FREQ_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setFrequency(opt.value)}
                    className={cn(
                      "flex-1 px-1.5 py-1.5 transition-colors border-r last:border-r-0 text-center text-xs",
                      frequency === opt.value
                        ? "bg-foreground text-background font-medium"
                        : "hover:bg-muted text-muted-foreground",
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job rows */}
            <div className="flex flex-col gap-3">
              {jobs.map((job, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border p-3 bg-muted/10">
                  <p className="text-xs font-semibold text-muted-foreground">{job.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Hourly wage</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                        <Input type="number" min={0} step={0.5} value={job.wage}
                          onChange={(e) => updateJob(i, "wage", e.target.value)} className="pl-6" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Hrs / week</Label>
                      <Input type="number" min={0} max={80} value={job.hoursPerWeek}
                        onChange={(e) => updateJob(i, "hoursPerWeek", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-0.5">
                    <span>{fmt(perPaycheck(job.wage * job.hoursPerWeek * 52 / 12, frequency))} / paycheck</span>
                    <span>{fmt(job.wage * job.hoursPerWeek * 52 / 12)} / mo</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Stat label="Monthly gross"      value={fmt(monthlyGross)} />
              <Stat label="Est. take-home"     value={fmt(monthlyNet)}   sub="~25% tax" />
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>Fixed and variable costs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {(Object.keys(EXPENSE_LABELS) as ExpenseKey[]).map((key) => (
                <MoneyInput key={key} label={EXPENSE_LABELS[key]}
                  value={expenses[key]}
                  onChange={(v) => setExpenses((p) => ({ ...p, [key]: v }))} />
              ))}
            </div>

            {/* Breakdown bar */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total</span>
                <span className="font-semibold text-foreground">{fmt(totalExpenses)}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {(Object.keys(EXPENSE_LABELS) as ExpenseKey[]).map((key, i) => (
                  <div key={key}
                    className={cn("h-full transition-all", expenseColors[i])}
                    style={{ width: `${totalExpenses > 0 ? (expenses[key] / totalExpenses) * 100 : 0}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5">
                {(Object.keys(EXPENSE_LABELS) as ExpenseKey[]).map((key, i) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", expenseColors[i])} />
                    <span className="truncate">{EXPENSE_LABELS[key].split(" (")[0]}</span>
                    <span className="ml-auto tabular-nums">
                      {totalExpenses > 0 ? `${((expenses[key] / totalExpenses) * 100).toFixed(0)}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investments */}
        <Card>
          <CardHeader>
            <CardTitle>Investments</CardTitle>
            <CardDescription>
              Redirect a portion of monthly savings into an investment portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Allocation */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">% of savings to invest</Label>
              <div className="flex gap-1.5">
                {ALLOC_PRESETS.map((p) => (
                  <button key={p} onClick={() => setInvestPct(p)}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-xs transition-colors",
                      investPct === p
                        ? "bg-foreground text-background font-medium border-foreground"
                        : "hover:bg-muted text-muted-foreground",
                    )}>
                    {p}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={investPct}
                  onChange={(e) => setInvestPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>

            {/* Expected return */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Expected annual return</Label>
              <div className="flex gap-1.5">
                {RETURN_PRESETS.map((p) => (
                  <button key={p.value} onClick={() => setAnnualReturn(p.value)}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-xs transition-colors leading-tight px-1",
                      annualReturn === p.value
                        ? "bg-foreground text-background font-medium border-foreground"
                        : "hover:bg-muted text-muted-foreground",
                    )}>
                    <span className="block font-semibold">{p.value}%</span>
                    <span className="block text-[10px] opacity-70">{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={30}
                  step={0.1}
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>

            {/* Investment summary */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-1 gap-2">
                <Stat label="Monthly contribution" value={fmt(monthlyContrib)}
                  sub={inSurplus ? `${investPct}% of ${fmt(monthlySavings)} surplus` : "No surplus to invest"} />
                <Stat label="24-mo portfolio value" value={fmt(projectedPortfolio)}
                  sub={`at ${annualReturn}% annual return`} />
                <Stat label="24-mo total net worth" value={fmt(projectedTotal)}
                  highlight={projectedTotal > 0 ? "green" : "red"} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Loan Calculator ── */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Calculator</CardTitle>
          <CardDescription>
            Vehicle financing — monthly payment is factored into the savings projection above.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MoneyInput label="Vehicle Price" value={vehiclePrice} onChange={setVehiclePrice} />
            <MoneyInput label="Down Payment"  value={downPayment}  onChange={setDownPayment}  />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">APR</Label>
              <div className="relative">
                <Input type="number" min={0} max={30} step={0.1} value={apr}
                  onChange={(e) => setApr(parseFloat(e.target.value) || 0)} className="pr-7" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Loan Term</Label>
              <div className="flex gap-1 flex-wrap">
                {TERM_OPTIONS.map((t) => (
                  <button key={t} onClick={() => setTermMonths(t)}
                    className={cn(
                      "flex-1 min-w-11 rounded-md border py-1.5 text-xs transition-colors",
                      termMonths === t
                        ? "bg-foreground text-background font-medium border-foreground"
                        : "hover:bg-muted text-muted-foreground",
                    )}>
                    {t}mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Monthly payment" value={fmt(monthlyPayment)} sub={`${termMonths} months`} />
            <Stat label="Total interest"  value={fmt(Math.max(0, totalInterest))}
                  sub={`${((totalInterest / Math.max(1, principal)) * 100).toFixed(1)}% of principal`} />
            <Stat label="Total paid"      value={fmt(Math.max(0, totalPaid))} sub={`Principal: ${fmt(principal)}`} />
            <Stat label="Payoff date"     value={payoffDate} sub={`${termMonths}-month term`} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payment-to-income ratio</span>
              <span className={cn(
                "font-medium",
                ptiRatio > 0.3 ? "text-red-500" : ptiRatio > 0.15 ? "text-yellow-600" : "text-green-600",
              )}>
                {monthlyNet > 0 ? `${(ptiRatio * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  ptiRatio > 0.3 ? "bg-red-500" : ptiRatio > 0.15 ? "bg-yellow-500" : "bg-green-500",
                )}
                style={{ width: `${Math.min(100, ptiRatio * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {ptiRatio > 0.3
                ? "Above 30% — this loan may strain your budget."
                : ptiRatio > 0.15
                ? "Between 15–30% — manageable, watch your spending."
                : "Under 15% — within a comfortable range."}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

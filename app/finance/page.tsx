"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinanceOverall, getFinanceMonthly } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Overall = {
  revenue: number; cogs: number; gross_profit: number;
  expenses: number; net_profit: number;
  collected: number; outstanding: number; total_orders: number;
};
type MonthRow = Overall & { month: string; order_count: number };

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}
function compact(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000)   return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}
function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}
function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1)
    .toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function currentMonthStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

// ── PnL badge ─────────────────────────────────────────────────────────────────
function PnlBadge({ value, lg }: { value: number; lg?: boolean }) {
  const positive = value > 0, zero = value === 0;
  const cls = zero
    ? "text-slate-400 bg-slate-100"
    : positive
    ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
    : "text-red-700 bg-red-50 border border-red-200";
  const Icon = zero ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-bold shrink-0 ${lg ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"} ${cls}`}>
      <Icon size={lg ? 14 : 11} />
      {zero ? "Break-even" : positive ? "PROFIT" : "LOSS"}
    </span>
  );
}

// ── Overall summary tiles ─────────────────────────────────────────────────────
function OverallTiles({ d }: { d: Overall }) {
  const tiles = [
    { label: "Total Billed",    labelHi: "कुल बिल",      value: fmtINR(d.revenue),    sub: `${d.total_orders} orders`,                                        color: "border-slate-200",                            num: "text-slate-800"    },
    { label: "Cash Collected",  labelHi: "नकद प्राप्त",   value: fmtINR(d.collected),  sub: d.outstanding > 0 ? `${compact(d.outstanding)} outstanding` : "Fully collected",  color: "border-slate-200 hover:border-teal-200",      num: "text-teal-700"     },
    { label: "Total Expenses",  labelHi: "कुल खर्च",      value: fmtINR(d.expenses),   sub: `COGS ${compact(d.cogs)} + Ops ${compact(d.expenses - d.cogs < 0 ? 0 : d.expenses)}`, color: "border-slate-200 hover:border-rose-200",      num: "text-rose-600"     },
    { label: "Net Profit",      labelHi: "शुद्ध लाभ",     value: fmtINR(d.net_profit), sub: pct(d.net_profit, d.revenue) + " net margin",                      color: d.net_profit >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30", num: d.net_profit >= 0 ? "text-emerald-700" : "text-red-600" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(t => (
        <div key={t.label} className={`bg-white rounded-xl border ${t.color} p-5 transition-all hover:shadow-sm`}>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.label}</p>
          <p className={`text-2xl font-bold tabular-nums leading-none ${t.num}`}>{t.value}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">{t.sub}</p>
          <p className="text-[10px] text-slate-300 mt-1">{t.labelHi}</p>
        </div>
      ))}
    </div>
  );
}

// ── Gross profit / outstanding banner ────────────────────────────────────────
function GrossBanner({ d }: { d: Overall }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-wrap gap-x-8 gap-y-4 items-center">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gross Profit (All Time)</p>
        <div className="flex items-center gap-2.5">
          <p className={`text-xl font-bold tabular-nums ${d.gross_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtINR(d.gross_profit)}</p>
          <PnlBadge value={d.gross_profit} />
          <span className="text-xs text-slate-400">{pct(d.gross_profit, d.revenue)} margin</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Revenue {compact(d.revenue)} − COGS {compact(d.cogs)}</p>
      </div>
      <div className="hidden lg:block h-10 w-px bg-slate-200" />
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Profit (After Ops Expenses)</p>
        <div className="flex items-center gap-2.5">
          <p className={`text-xl font-bold tabular-nums ${d.net_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtINR(d.net_profit)}</p>
          <PnlBadge value={d.net_profit} />
          <span className="text-xs text-slate-400">{pct(d.net_profit, d.revenue)} margin</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Gross {compact(d.gross_profit)} − Ops {compact(d.expenses)}</p>
      </div>
      {d.outstanding > 0 && (
        <>
          <div className="hidden lg:block h-10 w-px bg-slate-200" />
          <div>
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-1">Outstanding Receivables</p>
            <p className="text-xl font-bold text-amber-600 tabular-nums">{fmtINR(d.outstanding)}</p>
            <p className="text-xs text-slate-400 mt-1">Billed but not yet collected</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Month accordion row ───────────────────────────────────────────────────────
function MonthAccordion({ row, defaultOpen }: { row: MonthRow; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const isProfit = row.net_profit >= 0;
  const grossPct = row.revenue ? Math.round((row.gross_profit / row.revenue) * 100) : 0;
  const outstanding = Math.max(0, row.outstanding);

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${open ? (isProfit ? "border-emerald-200" : "border-red-200") : "border-slate-200 hover:border-slate-300"}`}>

      {/* ── Collapsed / header row ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 sm:gap-5 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        {/* Chevron */}
        <span className="text-slate-400 shrink-0">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>

        {/* Month name */}
        <div className="min-w-[130px]">
          <p className="text-sm font-bold text-slate-800">{monthLabel(row.month)}</p>
          {row.order_count > 0 && (
            <p className="text-[11px] text-slate-400">{row.order_count} order{row.order_count !== 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Net P&L — always visible */}
        <div className="flex items-center gap-2 shrink-0">
          <p className={`text-sm font-bold tabular-nums ${isProfit ? "text-emerald-700" : "text-red-600"}`}>
            {row.net_profit >= 0 ? "+" : ""}{compact(row.net_profit)}
          </p>
          <PnlBadge value={row.net_profit} />
        </div>

        {/* Key numbers — hidden on small mobile, shown sm+ */}
        <div className="hidden sm:flex items-center gap-4 ml-auto text-right">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
            <p className="text-xs font-semibold text-slate-700 tabular-nums">{compact(row.revenue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected</p>
            <p className="text-xs font-semibold text-teal-600 tabular-nums">{compact(row.collected)}</p>
          </div>
          {outstanding > 0 && (
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Outstanding</p>
              <p className="text-xs font-semibold text-amber-600 tabular-nums">{compact(outstanding)}</p>
            </div>
          )}
        </div>
      </button>

      {/* ── Expanded P&L detail ── */}
      {open && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/30 space-y-0">

          <div className="max-w-md space-y-0 divide-y divide-slate-100">

            {/* Revenue */}
            <div className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm text-slate-600">Revenue <span className="text-slate-400 text-xs">(बिल)</span></p>
              </div>
              <p className="text-sm font-semibold text-slate-800 tabular-nums">{fmtINR(row.revenue)}</p>
            </div>

            {/* COGS */}
            <div className="flex items-center justify-between py-2.5 pl-4">
              <p className="text-sm text-slate-500">Cost of Goods (COGS)</p>
              <p className="text-sm text-slate-600 tabular-nums">− {fmtINR(row.cogs)}</p>
            </div>

            {/* Gross profit */}
            <div className="flex items-center justify-between py-2.5 bg-white/70 rounded-lg px-2 -mx-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Gross Profit</p>
                <p className="text-[11px] text-slate-400">{grossPct}% gross margin</p>
              </div>
              <p className={`text-sm font-bold tabular-nums ${row.gross_profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {fmtINR(row.gross_profit)}
              </p>
            </div>

            {/* Expenses */}
            <div className="flex items-center justify-between py-2.5 pl-4">
              <p className="text-sm text-slate-500">Operating Expenses</p>
              <p className="text-sm text-slate-600 tabular-nums">− {fmtINR(row.expenses)}</p>
            </div>

            {/* Net profit */}
            <div className={`flex items-center justify-between py-3 border-t-2 mt-1 ${isProfit ? "border-emerald-200" : "border-red-200"}`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800">Net Profit / Loss</p>
                {isProfit
                  ? <ArrowUpRight size={15} className="text-emerald-500" />
                  : <ArrowDownRight size={15} className="text-red-400" />}
              </div>
              <p className={`text-base font-bold tabular-nums ${isProfit ? "text-emerald-700" : "text-red-600"}`}>
                {row.net_profit >= 0 ? "+" : ""}{fmtINR(row.net_profit)}
              </p>
            </div>
          </div>

          {/* Cash position pills */}
          <div className="flex gap-3 pt-3 border-t border-slate-200 mt-2">
            <div className="flex-1 text-center px-3 py-2 bg-teal-50 border border-teal-100 rounded-lg">
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Collected</p>
              <p className="text-sm font-bold text-teal-700 tabular-nums mt-0.5">{fmtINR(row.collected)}</p>
            </div>
            <div className={`flex-1 text-center px-3 py-2 rounded-lg border ${outstanding > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>Outstanding</p>
              <p className={`text-sm font-bold tabular-nums mt-0.5 ${outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {outstanding > 0 ? fmtINR(outstanding) : "Fully paid ✓"}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const { data: overall, isLoading: loadingOverall } = useQuery({
    queryKey: ["finance-overall"],
    queryFn: getFinanceOverall,
    staleTime: 60_000,
  });
  const { data: monthlyRaw, isLoading: loadingMonthly } = useQuery({
    queryKey: ["finance-monthly"],
    queryFn: getFinanceMonthly,
    staleTime: 60_000,
  });

  const o = overall as Overall | undefined;
  const monthly = (monthlyRaw as MonthRow[] | undefined) ?? [];
  const thisMonth = currentMonthStr();

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Finance & P&L</h1>
        <p className="text-sm text-slate-400 mt-0.5">वित्त · Profit & Loss — complete business picture</p>
      </div>

      {/* Overall tiles */}
      {loadingOverall ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : o ? <OverallTiles d={o} /> : null}

      {/* Gross / net banner */}
      {loadingOverall ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : o ? <GrossBanner d={o} /> : null}

      {/* Monthly accordion */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Monthly Breakdown</h2>
          {!loadingMonthly && monthly.length > 0 && (
            <span className="text-xs text-slate-400">{monthly.length} months · click to expand</span>
          )}
        </div>

        {loadingMonthly ? (
          <div className="space-y-2">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : monthly.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <p className="text-slate-400 text-sm">No financial data yet</p>
            <p className="text-slate-300 text-xs mt-1">Create orders and record expenses to see your P&L</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthly.map(row => (
              <MonthAccordion
                key={row.month}
                row={row}
                defaultOpen={row.month === thisMonth}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

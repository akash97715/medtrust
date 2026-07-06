"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinanceOverall, getFinanceMonthly } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from "lucide-react";

type Overall = {
  revenue: number; expenses: number;
  collected: number; outstanding: number; total_orders: number;
};
type MonthRow = {
  month: string; revenue: number; expenses: number;
  collected: number; outstanding: number; order_count: number;
};

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
function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1)
    .toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function currentMonthStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

// ── Summary tiles ─────────────────────────────────────────────────────────────
function SummaryTiles({ d }: { d: Overall }) {
  const profit = d.revenue - d.expenses;
  const isProfit = profit >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

      {/* Total Billed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Billed</p>
        <p className="text-2xl font-bold tabular-nums text-slate-800">{fmtINR(d.revenue)}</p>
        <p className="text-xs text-slate-400 mt-2">{d.total_orders} orders · all time</p>
      </div>

      {/* Total Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Expenses</p>
        <p className="text-2xl font-bold tabular-nums text-rose-600">{fmtINR(d.expenses)}</p>
        <p className="text-xs text-slate-400 mt-2">Salary, transport, rent & more</p>
      </div>

      {/* Profit */}
      <div className={`rounded-xl border p-5 ${isProfit ? "bg-emerald-50/40 border-emerald-200" : "bg-red-50/40 border-red-200"}`}>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Profit</p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-2xl font-bold tabular-nums ${isProfit ? "text-emerald-700" : "text-red-600"}`}>
            {fmtINR(profit)}
          </p>
          {isProfit
            ? <TrendingUp size={16} className="text-emerald-500 shrink-0" />
            : <TrendingDown size={16} className="text-red-400 shrink-0" />}
        </div>
        <p className="text-xs text-slate-400 mt-2">Billed − Expenses</p>
      </div>

      {/* Amount Received */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Amount Received</p>
        <p className="text-2xl font-bold tabular-nums text-teal-700">{fmtINR(d.collected)}</p>
        {d.outstanding > 0
          ? <p className="text-xs text-amber-500 mt-2">{fmtINR(d.outstanding)} still pending</p>
          : <p className="text-xs text-emerald-500 mt-2">Fully collected</p>}
      </div>

    </div>
  );
}

// ── Month accordion ───────────────────────────────────────────────────────────
function MonthAccordion({ row, defaultOpen }: { row: MonthRow; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const profit = row.revenue - row.expenses;
  const isProfit = profit >= 0;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${open ? (isProfit ? "border-emerald-200" : "border-red-200") : "border-slate-200 hover:border-slate-300"}`}>

      {/* Header row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 sm:gap-5 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <span className="text-slate-400 shrink-0">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>

        <div className="min-w-[130px]">
          <p className="text-sm font-bold text-slate-800">{monthLabel(row.month)}</p>
          {row.order_count > 0 && (
            <p className="text-[11px] text-slate-400">{row.order_count} order{row.order_count !== 1 ? "s" : ""}</p>
          )}
        </div>

        <div className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${isProfit ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"}`}>
          {isProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isProfit ? "+" : ""}{compact(profit)}
        </div>

        <div className="hidden sm:flex items-center gap-6 ml-auto text-right">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed</p>
            <p className="text-xs font-semibold text-slate-700 tabular-nums">{compact(row.revenue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenses</p>
            <p className="text-xs font-semibold text-rose-500 tabular-nums">{compact(row.expenses)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Received</p>
            <p className="text-xs font-semibold text-teal-600 tabular-nums">{compact(row.collected)}</p>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/30">
          <div className="max-w-xs space-y-0 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2.5">
              <p className="text-sm text-slate-600">Total Billed</p>
              <p className="text-sm font-semibold text-slate-800 tabular-nums">{fmtINR(row.revenue)}</p>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <p className="text-sm text-slate-600">Total Expenses</p>
              <p className="text-sm text-rose-600 tabular-nums">− {fmtINR(row.expenses)}</p>
            </div>
            <div className={`flex items-center justify-between py-3 border-t-2 ${isProfit ? "border-emerald-200" : "border-red-200"}`}>
              <p className="text-sm font-bold text-slate-800">Profit</p>
              <p className={`text-base font-bold tabular-nums ${isProfit ? "text-emerald-700" : "text-red-600"}`}>
                {isProfit ? "+" : ""}{fmtINR(profit)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-200 mt-2">
            <div className="flex-1 text-center px-3 py-2 bg-teal-50 border border-teal-100 rounded-lg">
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Received</p>
              <p className="text-sm font-bold text-teal-700 tabular-nums mt-0.5">{fmtINR(row.collected)}</p>
            </div>
            <div className={`flex-1 text-center px-3 py-2 rounded-lg border ${row.outstanding > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${row.outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>Pending</p>
              <p className={`text-sm font-bold tabular-nums mt-0.5 ${row.outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {row.outstanding > 0 ? fmtINR(row.outstanding) : "Fully paid"}
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

      <div>
        <h1 className="text-xl font-bold text-slate-800">Finance & P&L</h1>
        <p className="text-sm text-slate-400 mt-0.5">Total Billed · Expenses · Profit · Amount Received</p>
      </div>

      {loadingOverall ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : o ? <SummaryTiles d={o} /> : null}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Monthly</h2>
          {!loadingMonthly && monthly.length > 0 && (
            <span className="text-xs text-slate-400">{monthly.length} months · click to expand</span>
          )}
        </div>

        {loadingMonthly ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : monthly.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <p className="text-slate-400 text-sm">No data yet</p>
            <p className="text-slate-300 text-xs mt-1">Create orders and record expenses to see monthly P&L</p>
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

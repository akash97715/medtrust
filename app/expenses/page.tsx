"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpenses, createExpense, deleteExpense } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, IndianRupee } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Expense = {
  id: string;
  expense_type: string;
  amount: number;
  expense_date: string;
  paid_to: string | null;
  notes: string | null;
  created_at: string;
};

// ── Type config ───────────────────────────────────────────────────────────────
type TypeCfg = {
  label: string; labelHi: string;
  dot: string; text: string; bg: string; border: string; headerBg: string;
};

const TYPE_CONFIG: Record<string, TypeCfg> = {
  salary:         { label: "Salary",         labelHi: "वेतन",          dot: "bg-indigo-500",  text: "text-indigo-700",  bg: "bg-indigo-50",   border: "border-indigo-200",  headerBg: "bg-indigo-50/60"  },
  transportation: { label: "Transportation", labelHi: "परिवहन",        dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   headerBg: "bg-amber-50/60"   },
  purchase:       { label: "Purchase",       labelHi: "खरीद",          dot: "bg-teal-500",    text: "text-teal-700",    bg: "bg-teal-50",     border: "border-teal-200",    headerBg: "bg-teal-50/60"    },
  logistics:      { label: "Logistics",      labelHi: "लॉजिस्टिक्स",   dot: "bg-violet-500",  text: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200",  headerBg: "bg-violet-50/60"  },
  rent:           { label: "Rent",           labelHi: "किराया",         dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50",     border: "border-rose-200",    headerBg: "bg-rose-50/60"    },
  utilities:      { label: "Utilities",      labelHi: "सुविधाएँ",      dot: "bg-cyan-500",    text: "text-cyan-700",    bg: "bg-cyan-50",     border: "border-cyan-200",    headerBg: "bg-cyan-50/60"    },
  miscellaneous:  { label: "Miscellaneous",  labelHi: "अन्य",          dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100",   border: "border-slate-200",   headerBg: "bg-slate-50"      },
};

const TYPE_ORDER = ["salary", "transportation", "purchase", "logistics", "rent", "utilities", "miscellaneous"];

function cfg(type: string): TypeCfg {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.miscellaneous;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short",
  });
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-IN", {
    month: "long", year: "numeric",
  });
}

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function offsetMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const qc = useQueryClient();
  const [month, setMonth]     = useState(currentMonthStr());
  const [showForm, setShowForm] = useState(false);

  // Add-expense form state (plain useState — avoids React Compiler / RHF watch issues)
  const [fType,   setFType]   = useState("salary");
  const [fAmt,    setFAmt]    = useState("");
  const [fDate,   setFDate]   = useState(todayStr());
  const [fPaidTo, setFPaidTo] = useState("");
  const [fNotes,  setFNotes]  = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["expenses", month],
    queryFn: () => getExpenses(month),
    staleTime: 0,
  });

  const expenses = (raw as Expense[] | undefined) ?? [];

  // Group by type, ordered by TYPE_ORDER then by descending subtotal for unknowns
  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const arr = map.get(e.expense_type) ?? [];
      arr.push(e);
      map.set(e.expense_type, arr);
    }
    return [...map.keys()]
      .sort((a, b) => {
        const ia = TYPE_ORDER.indexOf(a), ib = TYPE_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(k => ({ type: k, rows: map.get(k)! }));
  }, [expenses]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const addMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success("Expense recorded");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
      setFAmt(""); setFPaidTo(""); setFNotes(""); setFType("salary"); setFDate(todayStr());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit() {
    const amt = parseFloat(fAmt);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (fType === "salary" && !fPaidTo.trim()) { toast.error("Paid to is required for salary"); return; }
    addMutation.mutate({
      expense_type: fType,
      amount: amt,
      expense_date: fDate || undefined,
      paid_to: fPaidTo.trim() || undefined,
      notes: fNotes.trim() || undefined,
    });
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Expenses</h1>
          <p className="text-sm text-slate-400 mt-0.5">खर्च ट्रैकर · Operational cost tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month picker */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1 h-9">
            <button
              onClick={() => setMonth(m => offsetMonth(m, -1))}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center select-none">
              {monthLabel(month)}
            </span>
            <button
              onClick={() => setMonth(m => offsetMonth(m, +1))}
              disabled={month >= currentMonthStr()}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <Button
            onClick={() => setShowForm(v => !v)}
            className={`h-9 text-sm px-4 gap-1.5 font-semibold ${showForm ? "bg-slate-600 hover:bg-slate-700" : "bg-teal-600 hover:bg-teal-700"}`}
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? "Cancel" : "Add Expense"}
          </Button>
        </div>
      </div>

      {/* ── Monthly summary ── */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
        {isLoading ? (
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total · {monthLabel(month)}
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmtINR(total)}</p>
            </div>
            {grouped.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {grouped.map(g => {
                  const c = cfg(g.type);
                  const sub = g.rows.reduce((s, r) => s + r.amount, 0);
                  return (
                    <div key={g.type} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${c.bg} ${c.border}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
                      <span className="text-xs text-slate-500 font-medium tabular-nums">{fmtINR(sub)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {expenses.length === 0 && !isLoading && (
              <p className="text-sm text-slate-400 italic">No expenses recorded for this month</p>
            )}
          </div>
        )}
      </div>

      {/* ── Add expense form ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-teal-200 overflow-hidden">
          <div className="px-5 py-3.5 bg-teal-50/60 border-b border-teal-100 flex items-center gap-2">
            <IndianRupee size={13} className="text-teal-600 shrink-0" />
            <p className="text-sm font-bold text-teal-800">Record New Expense · खर्च दर्ज करें</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Expense Type *
                </label>
                <select
                  value={fType}
                  onChange={e => setFType(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {TYPE_ORDER.map(t => (
                    <option key={t} value={t}>
                      {TYPE_CONFIG[t].label} — {TYPE_CONFIG[t].labelHi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Amount (₹) *</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={fAmt}
                  onChange={e => setFAmt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="e.g. 5000"
                  className="bg-white"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Paid To {fType === "salary" ? <span className="text-red-400">*</span> : <span className="text-slate-400 normal-case font-normal">(optional)</span>}
                </label>
                <Input
                  value={fPaidTo}
                  onChange={e => setFPaidTo(e.target.value)}
                  placeholder={fType === "salary" ? "Employee name / कर्मचारी का नाम" : "Vendor / person"}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Date</label>
                <Input
                  type="date"
                  value={fDate}
                  onChange={e => setFDate(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Notes <span className="text-slate-400 normal-case font-normal">(optional)</span>
              </label>
              <Input
                value={fNotes}
                onChange={e => setFNotes(e.target.value)}
                placeholder="Additional details about this expense…"
                className="bg-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={addMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 h-9 px-5 text-sm font-semibold"
              >
                {addMutation.isPending ? "Saving…" : "Save Expense"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 px-4 text-sm">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grouped expense list ── */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <p className="text-slate-400 text-sm">No expenses for {monthLabel(month)}</p>
          <p className="text-slate-300 text-xs mt-1">
            Click <span className="font-semibold">Add Expense</span> to record your first entry
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ type, rows }) => {
            const c = cfg(type);
            const subtotal = rows.reduce((s, r) => s + r.amount, 0);
            return (
              <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                {/* Group header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${c.border} ${c.headerBg}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                    <p className={`text-sm font-bold ${c.text}`}>{c.label}</p>
                    <span className="text-xs text-slate-400 font-medium">{c.labelHi}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">
                      {rows.length} {rows.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${c.text}`}>{fmtINR(subtotal)}</p>
                </div>

                {/* Expense rows */}
                <div className="divide-y divide-slate-100">
                  {rows.map(row => (
                    <div
                      key={row.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 group transition-colors"
                    >
                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        {row.paid_to ? (
                          <p className="text-sm font-semibold text-slate-800 truncate">{row.paid_to}</p>
                        ) : null}
                        {row.notes ? (
                          <p className={`truncate ${
                            row.paid_to
                              ? "text-[11px] text-slate-400 mt-0.5"
                              : "text-sm font-medium text-slate-700"
                          }`}>
                            {row.notes}
                          </p>
                        ) : !row.paid_to ? (
                          <p className="text-sm text-slate-400 italic">{c.label}</p>
                        ) : null}
                      </div>

                      {/* Amount + date */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-800 tabular-nums">{fmtINR(row.amount)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(row.expense_date)}</p>
                      </div>

                      {/* Delete — visible on hover */}
                      <button
                        onClick={() => delMutation.mutate(row.id)}
                        disabled={delMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md shrink-0"
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

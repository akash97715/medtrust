"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStock, getStockHistory, updateStock } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Pencil, X, Check, ChevronDown, ChevronUp, Plus, PackageCheck, Info } from "lucide-react";

type StockRow = {
  product_id: string;
  product_name: string;
  hindi_name: string | null;
  product_category: string | null;
  unit_of_measure: string;
  stock_quantity: number;
  last_update_type: string | null;
  last_party_name: string | null;
  last_updated_at: string | null;
};

type HistoryRow = {
  id: string;
  product_name: string;
  hindi_name: string | null;
  unit_of_measure: string;
  adjustment_type: string;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  party_name: string | null;
  notes: string | null;
  created_at: string;
};

type Level = { dot: string; num: string; badge: string; hi: string; en: string };

function stockLevel(qty: number, everSet: boolean): Level {
  if (!everSet)  return { dot: "bg-slate-300",   num: "text-slate-400",   badge: "bg-slate-100 text-slate-400",   hi: "अज्ञात",  en: "Not set"      };
  if (qty === 0) return { dot: "bg-red-500",     num: "text-red-600",     badge: "bg-red-50 text-red-600",        hi: "खत्म",    en: "Out of stock" };
  if (qty <= 5)  return { dot: "bg-amber-400",   num: "text-amber-600",   badge: "bg-amber-50 text-amber-600",    hi: "कम",      en: "Low"          };
  return           { dot: "bg-emerald-500", num: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700", hi: "अच्छा",   en: "Good"         };
}

function adjLabelEn(type: string) {
  if (type === "manual_set")    return "Manual update";
  if (type === "order_deduct")  return "Sold via order";
  if (type === "order_restore") return "Restored";
  if (type === "order_update")  return "Order edit";
  return type;
}
function adjLabelHi(type: string) {
  if (type === "manual_set")    return "मैन्युअल";
  if (type === "order_deduct")  return "बिक्री";
  if (type === "order_restore") return "वापसी";
  if (type === "order_update")  return "बदलाव";
  return type;
}
function relTime(ts: string | null) {
  if (!ts) return null;
  const h = (Date.now() - new Date(ts).getTime()) / 36e5;
  if (h < 1)  return "Just now";
  if (h < 24) return `${Math.floor(h)}h ago`;
  if (h < 48) return "Yesterday";
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDT(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ── Summary tile ────────────────────────────────────────────────────────────
function SummaryTile({
  count, label, hindi, accent, children,
}: {
  count: number;
  label: string;
  hindi: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`group relative bg-white rounded-xl border ${accent} p-5 hover:shadow-sm transition-all cursor-default select-none`}>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-3xl font-bold tabular-nums leading-none ${
        label === "Out of Stock" ? "text-red-600" :
        label === "Running Low"  ? "text-amber-600" :
        label === "Good Stock"   ? "text-emerald-700" : "text-slate-500"
      }`}>{count}</p>
      <p className="text-xs text-slate-400 mt-2 font-medium">{hindi}</p>
      {children}
    </div>
  );
}

// ── Out-of-stock tile with hover tooltip ────────────────────────────────────
function OutOfStockTile({ count, products }: { count: number; products: StockRow[] }) {
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 hover:border-red-200 p-5 hover:shadow-sm transition-all cursor-default select-none">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Out of Stock</p>
      <p className="text-3xl font-bold tabular-nums leading-none text-red-600">{count}</p>
      <p className="text-xs text-slate-400 mt-2 font-medium">खत्म हो गया</p>

      {count > 0 && (
        <div className="pointer-events-none absolute top-full left-0 mt-2 z-50 w-64 bg-slate-900 rounded-xl shadow-2xl border border-slate-700/60 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
            Out of Stock · {count} product{count !== 1 ? "s" : ""}
          </p>
          <div className="space-y-0.5 max-h-52 overflow-auto pr-1">
            {products.map((p) => (
              <div key={p.product_id} className="flex items-center gap-2.5 py-1.5 border-b border-slate-700/50 last:border-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-200 truncate">{p.product_name}</p>
                  {p.hindi_name && <p className="text-[10px] text-slate-500 truncate">{p.hindi_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState("");
  const [editNote, setEditNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data: rawStock, isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: getStock,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: historyRaw } = useQuery({
    queryKey: ["stock-history"],
    queryFn: getStockHistory,
    enabled: showHistory,
  });

  const mutation = useMutation({
    mutationFn: ({ id, qty, notes }: { id: string; qty: number; notes?: string }) =>
      updateStock(id, { quantity: qty, notes }),
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
      setEditingId(null); setNewQty(""); setEditNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (rawStock as StockRow[] | undefined) ?? [];
  const history = (historyRaw as HistoryRow[] | undefined) ?? [];

  const filtered = useMemo(() =>
    rows.filter(r =>
      !search ||
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.hindi_name ?? "").includes(search) ||
      (r.product_category ?? "").toLowerCase().includes(search.toLowerCase())
    ), [rows, search]);

  const outProducts = rows.filter(r => r.last_updated_at !== null && r.stock_quantity === 0);
  const outCount  = outProducts.length;
  const lowCount  = rows.filter(r => r.stock_quantity > 0 && r.stock_quantity <= 5).length;
  const okCount   = rows.filter(r => r.stock_quantity > 5).length;
  const noneCount = rows.filter(r => r.last_updated_at === null).length;

  function startEdit(row: StockRow) { setEditingId(row.product_id); setNewQty(String(row.stock_quantity)); setEditNote(""); }
  function cancelEdit() { setEditingId(null); setNewQty(""); setEditNote(""); }
  function saveEdit(id: string) {
    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty < 0) { toast.error("Enter a valid number"); return; }
    mutation.mutate({ id, qty, notes: editNote || undefined });
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products & Stock</h1>
          <p className="text-sm text-slate-400 mt-0.5">उत्पाद और स्टॉक · Live inventory</p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/product"
            className="flex items-center gap-1.5 bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors shrink-0"
          >
            <Plus size={14} /> Add Product
          </Link>
        )}
      </div>

      {/* ── Summary tiles ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OutOfStockTile count={outCount} products={outProducts} />
          <SummaryTile count={lowCount} label="Running Low" hindi="कम स्टॉक" accent="border-slate-200 hover:border-amber-200" />
          <SummaryTile count={okCount}   label="Good Stock"  hindi="अच्छा स्टॉक" accent="border-slate-200 hover:border-emerald-200" />
          <SummaryTile count={noneCount} label="Not Set Yet" hindi="स्टॉक नहीं डाला" accent="border-slate-200" />
        </div>
      )}

      {/* ── How-to guide ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={13} className="text-slate-400 shrink-0" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            स्टॉक कैसे अपडेट करें &nbsp;·&nbsp; How to Update Stock
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: "1", en: "Find product below",  hi: "नीचे product ढूंढें" },
            { step: "2", en: "Click Update Stock",  hi: "Update Stock दबाएं" },
            { step: "3", en: "Enter new quantity",  hi: "नया number डालें" },
            { step: "4", en: "Press Save",          hi: "Save दबाएं ✓" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold shrink-0 mt-0.5">
                {s.step}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-700">{s.en}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.hi}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded px-2 py-0.5">Auto</span>
          <p className="text-xs text-slate-500">
            Order बनने पर stock खुद कम होता है &nbsp;·&nbsp; Stock auto-reduces when an order is created
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search product / उत्पाद खोजें…"
          className="pl-9 text-sm h-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Product table ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_72px_1fr_1fr_52px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Product</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unit</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Stock</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</span>
          <span />
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No products found.</p>
            {search && <p className="text-slate-300 text-xs mt-1">Try a different search term.</p>}
          </div>
        ) : (
          filtered.map(row => {
            const lvl = stockLevel(row.stock_quantity, row.last_updated_at !== null);
            const isEditing = editingId === row.product_id;

            return (
              <div key={row.product_id} className="border-b border-slate-100 last:border-0">

                {/* Main row */}
                <div className={`grid grid-cols-1 sm:grid-cols-[2fr_72px_1fr_1fr_52px] gap-2 sm:gap-4 px-5 py-4 items-center transition-colors ${
                  isEditing ? "bg-teal-50/50" : "hover:bg-slate-50/60"
                }`}>

                  {/* Product name */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{row.product_name}</p>
                    {row.hindi_name && <p className="text-xs text-slate-400 mt-0.5 truncate">{row.hindi_name}</p>}
                    {row.product_category && (
                      <span className="inline-block text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 mt-1 font-medium">
                        {row.product_category}
                      </span>
                    )}
                  </div>

                  {/* Unit */}
                  <div className="hidden sm:block">
                    <span className="text-xs text-slate-500">{row.unit_of_measure}</span>
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-2.5 flex-wrap mt-1 sm:mt-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${lvl.dot}`} />
                    {row.last_updated_at !== null ? (
                      <span className={`text-sm font-bold tabular-nums ${lvl.num}`}>{row.stock_quantity}</span>
                    ) : (
                      <span className="text-sm text-slate-300 font-medium">—</span>
                    )}
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${lvl.badge}`}>
                      {row.last_updated_at ? lvl.en : "Not set"}
                    </span>
                    <button
                      onClick={() => isEditing ? cancelEdit() : startEdit(row)}
                      className={`ml-auto sm:ml-0 flex items-center gap-1 text-xs font-semibold transition-colors shrink-0 ${
                        isEditing
                          ? "text-slate-400 hover:text-slate-600"
                          : "text-teal-600 hover:text-teal-800 hover:underline underline-offset-2"
                      }`}
                    >
                      {isEditing ? <X size={12} /> : <Pencil size={11} />}
                      {isEditing ? "Cancel" : "Update"}
                    </button>
                  </div>

                  {/* Last updated */}
                  <div className="hidden sm:block">
                    {row.last_updated_at ? (
                      <div>
                        <p className="text-xs font-medium text-slate-600">{relTime(row.last_updated_at)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {adjLabelEn(row.last_update_type ?? "")}
                          {row.last_party_name ? <span className="text-slate-300"> · {row.last_party_name}</span> : null}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300">Never updated</p>
                    )}
                  </div>

                  {/* Admin pencil */}
                  {isAdmin ? (
                    <div className="hidden sm:flex justify-center">
                      <Link
                        href={`/products/${row.product_id}/edit`}
                        className="text-slate-300 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                        title="Edit product"
                      >
                        <Pencil size={12} />
                      </Link>
                    </div>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>

                {/* Inline edit panel */}
                {isEditing && (
                  <div className="px-5 pb-5 pt-4 border-t border-teal-100 bg-teal-50/40">
                    <div className="max-w-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{row.product_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Current stock: <span className="font-semibold text-slate-600">{row.stock_quantity} {row.unit_of_measure}</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">
                          New Quantity / नई मात्रा
                        </label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={newQty}
                            onChange={e => setNewQty(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && saveEdit(row.product_id)}
                            className="w-32 text-xl font-bold text-center h-11 bg-white border-slate-300 focus-visible:ring-teal-500"
                            autoFocus
                          />
                          <span className="text-sm text-slate-500 font-medium">{row.unit_of_measure}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">
                          Note (optional) / नोट
                        </label>
                        <Input
                          placeholder="e.g. New batch received"
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          className="text-sm bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          onClick={() => saveEdit(row.product_id)}
                          disabled={mutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700 h-9 text-sm px-5 font-semibold"
                        >
                          <Check size={13} className="mr-1.5" />
                          {mutation.isPending ? "Saving…" : "Save Stock"}
                        </Button>
                        <Button variant="outline" onClick={cancelEdit} className="h-9 text-sm px-4">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Stock History ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <PackageCheck size={14} className="text-slate-400" />
            <span className="font-semibold text-sm text-slate-700">Stock History</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">— Every change, automatically logged</span>
          </div>
          {showHistory
            ? <ChevronUp size={14} className="text-slate-400" />
            : <ChevronDown size={14} className="text-slate-400" />}
        </button>

        {showHistory && (
          <div className="border-t border-slate-100 overflow-x-auto">
            {history.length === 0 ? (
              <p className="py-10 text-center text-slate-400 text-sm">No history yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Change</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">New Stock</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Party / Note</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-700">{h.product_name}</p>
                        {h.hindi_name && <p className="text-slate-400 mt-0.5">{h.hindi_name}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold tabular-nums">
                        <span className={h.qty_change >= 0 ? "text-emerald-600" : "text-red-500"}>
                          {h.qty_change >= 0 ? "+" : ""}{h.qty_change} {h.unit_of_measure}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-700 tabular-nums">
                        {h.qty_after} {h.unit_of_measure}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-slate-600">{adjLabelEn(h.adjustment_type)}</span>
                        <p className="text-slate-400 mt-0.5">{adjLabelHi(h.adjustment_type)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-[140px] truncate">{h.party_name ?? h.notes ?? "—"}</td>
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{fmtDT(h.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

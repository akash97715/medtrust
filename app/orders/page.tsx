"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api";
import { money } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Pencil, FileText, Package, Banknote, ChevronRight, Building2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  confirmed:        "bg-green-50 text-green-700 border border-green-200",
  delivered:        "bg-blue-50 text-blue-700 border border-blue-200",
  partial_payment:  "bg-orange-50 text-orange-700 border border-orange-200",
  payment_received: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  draft:            "bg-amber-50 text-amber-700 border border-amber-200",
  cancelled:        "bg-slate-100 text-slate-400 border border-slate-200",
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type OrderSummary = {
  order_id: string;
  order_date: string;
  party_id: string;
  party_name: string;
  order_status: string;
  reference_number: string | null;
  item_count: number;
  total_value: number;
  total_received: number;
  grand_total: number;
};

type PartyGroup = {
  party_id: string;
  party_name: string;
  orders: OrderSummary[];
  totalOutstanding: number;
  hasActive: boolean;
};

function groupOrders(
  rows: Record<string, unknown>[],
  paymentTotals: Record<string, number>,
  grandTotals: Record<string, number>,
): OrderSummary[] {
  const map = new Map<string, OrderSummary>();
  for (const r of rows) {
    const id = String(r.order_id);
    if (!map.has(id)) {
      map.set(id, {
        order_id: id,
        order_date: String(r.order_date),
        party_id: String(r.party_id),
        party_name: String(r.party_name),
        order_status: String(r.order_status),
        reference_number: r.reference_number ? String(r.reference_number) : null,
        item_count: 0,
        total_value: 0,
        total_received: paymentTotals[id] ?? 0,
        grand_total: grandTotals[id] ?? 0,
      });
    }
    const entry = map.get(id)!;
    entry.item_count += 1;
    entry.total_value += Number(r.line_value) || 0;
  }
  return Array.from(map.values());
}

function groupByParty(orders: OrderSummary[]): PartyGroup[] {
  const map = new Map<string, PartyGroup>();
  for (const o of orders) {
    if (!map.has(o.party_id)) {
      map.set(o.party_id, { party_id: o.party_id, party_name: o.party_name, orders: [], totalOutstanding: 0, hasActive: false });
    }
    const g = map.get(o.party_id)!;
    g.orders.push(o);
    const isActive = o.order_status !== "payment_received" && o.order_status !== "cancelled";
    if (isActive) {
      const orderTotal = o.grand_total > 0 ? o.grand_total : o.total_value;
      g.totalOutstanding += Math.max(0, orderTotal - o.total_received);
      g.hasActive = true;
    }
  }
  // Sort: parties with outstanding first, then alphabetical
  return Array.from(map.values())
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding || a.party_name.localeCompare(b.party_name));
}

// ── Payment cell ─────────────────────────────────────────────────────────────
function PaymentCell({ o }: { o: OrderSummary }) {
  if (o.order_status === "payment_received") {
    return <span className="text-xs text-emerald-600 font-semibold">✓ Fully paid</span>;
  }
  if (o.order_status === "cancelled") {
    return <span className="text-xs text-slate-300">—</span>;
  }
  if (o.grand_total > 0 && o.total_received > 0) {
    const pct = Math.min(100, Math.round(o.total_received / o.grand_total * 100));
    return (
      <div className="min-w-[100px]">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-emerald-600 font-semibold">{money(o.total_received)}</span>
          <span className="text-slate-400">{money(o.grand_total - o.total_received)} left</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-24">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  if (o.grand_total > 0) {
    return (
      <Link
        href={`/orders/${o.order_id}`}
        className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-800 font-semibold group"
      >
        <Banknote size={11} />
        Record payment
      </Link>
    );
  }
  return <span className="text-xs text-slate-300">—</span>;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [expandedParties, setExpandedParties] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const d = data as {
    rows: Record<string, unknown>[];
    total_confirmed_value: number;
    total_collected: number;
    payment_totals: Record<string, number>;
    grand_totals: Record<string, number>;
  } | undefined;

  const allOrders = useMemo(
    () => groupOrders(d?.rows ?? [], d?.payment_totals ?? {}, d?.grand_totals ?? {}),
    [d],
  );

  const partyGroups = useMemo(() => groupByParty(allOrders), [allOrders]);

  // Auto-expand active parties once on first load
  useEffect(() => {
    if (partyGroups.length > 0 && !initialized) {
      setExpandedParties(new Set(partyGroups.filter(g => g.hasActive).map(g => g.party_id)));
      setInitialized(true);
    }
  }, [partyGroups, initialized]);

  const toggleParty = (partyId: string) => {
    setExpandedParties(prev => {
      const next = new Set(prev);
      if (next.has(partyId)) next.delete(partyId); else next.add(partyId);
      return next;
    });
  };

  // Filtered groups (search-aware)
  const filteredGroups = useMemo(() => {
    if (!search) return partyGroups;
    const q = search.toLowerCase();
    return partyGroups.flatMap(g => {
      if (g.party_name.toLowerCase().includes(q)) return [g];
      const matching = g.orders.filter(o =>
        o.order_date.includes(q) || (o.reference_number ?? "").toLowerCase().includes(q)
      );
      if (!matching.length) return [];
      return [{ ...g, orders: matching }];
    });
  }, [partyGroups, search]);

  // When searching, show all matching groups expanded
  const effectiveExpanded = search
    ? new Set(filteredGroups.map(g => g.party_id))
    : expandedParties;

  // Summary metrics (all orders, not search-filtered)
  const activeOrders = allOrders.filter(o => o.order_status !== "payment_received" && o.order_status !== "cancelled");
  const totalOutstanding = activeOrders.reduce((s, o) => {
    const t = o.grand_total > 0 ? o.grand_total : o.total_value;
    return s + Math.max(0, t - o.total_received);
  }, 0);
  const totalCollected = d?.total_collected ?? 0;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-400 mt-0.5">All orders grouped by party</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-teal-700 transition-colors shrink-0"
        >
          + Add Order
        </Link>
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-orange-200 rounded-xl p-4">
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-1.5">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600 tabular-nums">{money(totalOutstanding)}</p>
            <p className="text-xs text-slate-400 mt-1">{activeOrders.length} order{activeOrders.length !== 1 ? "s" : ""} awaiting payment</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Collected</p>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">{money(totalCollected)}</p>
            <p className="text-xs text-slate-400 mt-1">Payments received to date</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Order Book</p>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">{money(d?.total_confirmed_value)}</p>
            <p className="text-xs text-slate-400 mt-1">Total confirmed value</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search party, date, or reference…"
          className="pl-9 text-sm h-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Party-grouped list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <p className="text-slate-400 text-sm">No orders found.</p>
          {search && <p className="text-slate-300 text-xs mt-1">Try a different search term.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map(g => {
            const isExpanded = effectiveExpanded.has(g.party_id);
            const sortedOrders = [...g.orders].sort(
              (a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
            );

            return (
              <div key={g.party_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                {/* Party header row */}
                <button
                  onClick={() => toggleParty(g.party_id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <ChevronRight
                    size={15}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                  />
                  <Building2 size={15} className="text-slate-300 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{g.party_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {g.orders.length} order{g.orders.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {g.totalOutstanding > 0 ? (
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600 tabular-nums">{money(g.totalOutstanding)}</p>
                        <p className="text-[11px] text-orange-400 mt-0.5">outstanding</p>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                        ✓ All settled
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded order rows */}
                {isExpanded && (
                  <div className="border-t border-slate-100">

                    {/* Column header */}
                    <div className="hidden sm:grid grid-cols-[1fr_90px_140px_80px_80px_36px] gap-4 pl-14 pr-5 py-2 bg-slate-50 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date / Ref</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Items</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</span>
                      <span />
                    </div>

                    {sortedOrders.map(o => (
                      <div
                        key={o.order_id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_90px_140px_80px_80px_36px] gap-2 sm:gap-4 pl-5 sm:pl-14 pr-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors items-center"
                      >
                        {/* Date */}
                        <div>
                          <Link
                            href={`/orders/${o.order_id}`}
                            className="text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline underline-offset-2 transition-colors"
                          >
                            {fmtDate(o.order_date)}
                          </Link>
                          {o.reference_number && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{o.reference_number}</p>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[o.order_status] ?? ""}`}>
                            {o.order_status.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Payment */}
                        <div><PaymentCell o={o} /></div>

                        {/* Items */}
                        <div className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Package size={11} /> {o.item_count}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-800 tabular-nums">
                            {money(o.grand_total > 0 ? o.grand_total : o.total_value)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/invoices/${o.order_id}`}
                            className="text-slate-300 hover:text-teal-600 transition-colors"
                            title="Invoice"
                          >
                            <FileText size={13} />
                          </Link>
                          <Link
                            href={`/orders/${o.order_id}/edit`}
                            className="text-slate-300 hover:text-teal-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

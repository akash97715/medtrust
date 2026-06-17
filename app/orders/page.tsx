"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api";
import { money } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Pencil, FileText, Package, Banknote } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  delivered: "bg-blue-100 text-blue-700",
  partial_payment: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  payment_received: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
  draft: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
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

export default function OrdersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const d = data as {
    rows: Record<string, unknown>[];
    total_confirmed_value: number;
    payment_totals: Record<string, number>;
    grand_totals: Record<string, number>;
  } | undefined;

  const orders = groupOrders(d?.rows ?? [], d?.payment_totals ?? {}, d?.grand_totals ?? {}).filter(
    (o) => !search ||
      o.party_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_date.includes(search) ||
      (o.reference_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">
            Order book · Confirmed value: <span className="font-semibold text-teal-700">{money(d?.total_confirmed_value)}</span>
          </p>
        </div>
        <Link href="/admin" className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          + Add order
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <Input placeholder="Search by party, date, or reference…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? <Skeleton className="h-64" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-500 text-left">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Party</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Payment</th>
                    <th className="pb-2 pr-4 font-medium text-center">Items</th>
                    <th className="pb-2 pr-4 font-medium text-right">Total Value</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.order_id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Link
                          href={`/orders/${o.order_id}`}
                          className="font-semibold text-teal-700 hover:text-teal-900 hover:underline underline-offset-2 transition-colors"
                        >
                          {fmtDate(o.order_date)}
                        </Link>
                        {o.reference_number && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{o.reference_number}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/parties/${o.party_id}`} className="hover:text-teal-700 transition-colors">
                          {o.party_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.order_status] ?? ""}`}>
                          {o.order_status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 min-w-[140px]">
                        {o.order_status === "payment_received" ? (
                          <span className="text-xs text-emerald-600 font-medium">✓ Fully paid</span>
                        ) : o.order_status === "cancelled" ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : o.grand_total > 0 ? (
                          <div>
                            {o.total_received > 0 ? (
                              <>
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="text-green-600 font-medium">{money(o.total_received)}</span>
                                  <span className="text-slate-400">{money(o.grand_total - o.total_received)} left</span>
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-28">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round(o.total_received / o.grand_total * 100))}%` }}
                                  />
                                </div>
                              </>
                            ) : (
                              <Link
                                href={`/orders/${o.order_id}`}
                                className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-800 font-medium group"
                              >
                                <Banknote size={11} className="group-hover:scale-110 transition-transform" />
                                Record payment
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Package size={11} />
                          {o.item_count}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-bold text-teal-700 text-base">
                        {money(o.total_value)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/invoices/${o.order_id}`} className="text-slate-400 hover:text-teal-600 transition-colors" title="Generate Invoice">
                            <FileText size={14} />
                          </Link>
                          <Link href={`/orders/${o.order_id}/edit`} className="text-slate-400 hover:text-teal-600 transition-colors" title="Edit Order">
                            <Pencil size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

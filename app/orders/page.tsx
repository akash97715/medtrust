"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Pencil, FileText } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  delivered: "bg-blue-100 text-blue-700",
  draft: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: getOrders });

  const d = data as { rows: Record<string, unknown>[]; total_confirmed_value: number } | undefined;
  const rows = (d?.rows ?? []).filter(
    (r) => !search ||
      String(r.party_name).toLowerCase().includes(search.toLowerCase()) ||
      String(r.product_name).toLowerCase().includes(search.toLowerCase()) ||
      String(r.order_date).includes(search)
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
        <Input placeholder="Search by party or product…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium text-right">Qty</th>
                    <th className="pb-2 pr-4 font-medium text-right">Buy Rate</th>
                    <th className="pb-2 pr-4 font-medium text-right">Sell Rate</th>
                    <th className="pb-2 pr-4 font-medium text-right">Line Value</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 pr-4 whitespace-nowrap font-medium">{fmt(r.order_date)}</td>
                      <td className="py-2 pr-4">
                        <Link href={`/parties/${r.party_id}`} className="text-teal-600 hover:underline">{fmt(r.party_name)}</Link>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[String(r.order_status)] ?? ""}`}>
                          {fmt(r.order_status)}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{fmt(r.product_name)}</td>
                      <td className="py-2 pr-4 text-right">{fmt(r.quantity)}</td>
                      <td className="py-2 pr-4 text-right">{money(r.buy_rate as number)}</td>
                      <td className="py-2 pr-4 text-right">{money(r.sell_rate as number)}</td>
                      <td className="py-2 pr-4 text-right font-medium text-teal-700">{money(r.line_value as number)}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Link href={`/invoices/${r.order_id}`} className="text-slate-400 hover:text-teal-600" title="Generate Invoice">
                            <FileText size={14} />
                          </Link>
                          <Link href={`/orders/${r.order_id}/edit`} className="text-slate-400 hover:text-teal-600" title="Edit Order">
                            <Pencil size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-slate-400">No orders found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

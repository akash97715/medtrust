"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Pencil, FileText, Lock } from "lucide-react";

const MASTER_CODE = "97715";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  delivered: "bg-blue-100 text-blue-700",
  draft: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const openDialog = (href: string) => { setPendingHref(href); setCode(""); setError(false); };
  const handleSubmit = () => {
    if (code === MASTER_CODE) { router.push(pendingHref!); setPendingHref(null); }
    else setError(true);
  };
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
                        {fmt(r.party_name)}
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
                          <button onClick={() => openDialog(`/invoices/${r.order_id}`)} className="text-slate-400 hover:text-teal-600" title="Generate Invoice">
                            <FileText size={14} />
                          </button>
                          <button onClick={() => openDialog(`/orders/${r.order_id}/edit`)} className="text-slate-400 hover:text-teal-600" title="Edit Order">
                            <Pencil size={14} />
                          </button>
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

      {pendingHref && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Employee Code Required</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">Enter your employee code to continue.</p>
            <Input type="password" placeholder="Enter code…" value={code} autoFocus
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            {error && <p className="text-xs text-red-500 mt-1.5">Invalid employee code. Please try again.</p>}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSubmit} className="flex-1 bg-teal-600 hover:bg-teal-700">Continue</Button>
              <Button variant="outline" onClick={() => setPendingHref(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

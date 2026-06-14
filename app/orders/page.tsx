"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Pencil, FileText, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  delivered: "bg-blue-100 text-blue-700",
  payment_received: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
  draft: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const router = useRouter();
  const { tryUnlock } = useAuth();
  const [search, setSearch] = useState("");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const openDialog = (href: string) => { setPendingHref(href); setError(false); setResetPin((v) => v + 1); };
  const handleComplete = async (pin: string) => {
    setLoading(true);
    setError(false);
    const ok = await tryUnlock(pin);
    setLoading(false);
    if (ok) { router.push(pendingHref!); setPendingHref(null); }
    else { setError(true); setResetPin((v) => v + 1); }
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
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 mx-auto mb-3">
              <Lock size={18} className="text-slate-400" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">Employee Code Required</h2>
            <p className="text-xs text-slate-400 mb-5">Enter your 5-digit employee code to continue.</p>
            <PinInput onComplete={handleComplete} loading={loading} reset={resetPin} />
            {loading && <p className="text-xs text-slate-400 mt-3">Verifying…</p>}
            {error && <p className="text-xs text-red-500 mt-3 font-medium">Incorrect code. Please try again.</p>}
            <button onClick={() => setPendingHref(null)} className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

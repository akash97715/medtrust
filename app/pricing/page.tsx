"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPricing } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function PricingPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["pricing"], queryFn: getPricing });

  const rows = (data as Record<string, unknown>[] ?? []).filter(
    (r) => !search ||
      String(r.party_name).toLowerCase().includes(search.toLowerCase()) ||
      String(r.product_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pricing</h1>
        <p className="text-slate-500 text-sm mt-1">Latest party-wise buy and sell rates per product</p>
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
                    <th className="pb-2 pr-4 font-medium">Party</th>
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium text-right">Buy Rate</th>
                    <th className="pb-2 pr-4 font-medium text-right">Sell Rate</th>
                    <th className="pb-2 pr-4 font-medium">Currency</th>
                    <th className="pb-2 font-medium">Effective From</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium">{fmt(r.party_name)}</td>
                      <td className="py-2 pr-4">{fmt(r.product_name)}</td>
                      <td className="py-2 pr-4 text-right">{money(r.buy_rate as number)}</td>
                      <td className="py-2 pr-4 text-right font-medium text-teal-700">{money(r.sell_rate as number)}</td>
                      <td className="py-2 pr-4 text-slate-500">{fmt(r.currency_code)}</td>
                      <td className="py-2 text-slate-500">{fmt(r.effective_from)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No pricing data found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

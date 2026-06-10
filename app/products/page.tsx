"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, Pencil } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const rows = (data as Record<string, unknown>[] ?? []).filter(
    (r) => !search || String(r.product_name).toLowerCase().includes(search.toLowerCase()) ||
      String(r.product_category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 text-sm mt-1">Product master with demand and order metrics</p>
        </div>
        <Link href="/admin" className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          + Add product
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <Input placeholder="Search products…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? <Skeleton className="h-64" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-500 text-left">
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium">SKU</th>
                    <th className="pb-2 pr-4 font-medium">Category</th>
                    <th className="pb-2 pr-4 font-medium">Unit</th>
                    <th className="pb-2 pr-4 font-medium text-right">Visit Requests</th>
                    <th className="pb-2 pr-4 font-medium text-right">Ordered Qty</th>
                    <th className="pb-2 pr-4 font-medium text-right">Order Value</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium">
                        {fmt(r.product_name)}
                        {!!r.sample_priority && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">sample</span>}
                      </td>
                      <td className="py-2 pr-4 text-slate-500">{fmt(r.sku)}</td>
                      <td className="py-2 pr-4 text-slate-500">{fmt(r.product_category)}</td>
                      <td className="py-2 pr-4 text-slate-500">{fmt(r.unit_of_measure)}</td>
                      <td className="py-2 pr-4 text-right">{fmt(r.times_requested_in_visits)}</td>
                      <td className="py-2 pr-4 text-right">{fmt(r.ordered_quantity)}</td>
                      <td className="py-2 pr-4 text-right font-medium text-teal-700">{money(r.ordered_value as number)}</td>
                      <td className="py-2">
                        <Link href={`/products/${r.product_id}/edit`} className="text-slate-400 hover:text-teal-600">
                          <Pencil size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400">No products found.</td></tr>
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

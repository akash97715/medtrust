"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVisits } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, Pencil } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  planned: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-600",
  no_contact: "bg-slate-100 text-slate-500",
};

export default function VisitsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["visits"], queryFn: getVisits, staleTime: 0, refetchOnMount: "always" });

  const rows = (data as Record<string, unknown>[] ?? []).filter(
    (r) => !search ||
      String(r.party_name).toLowerCase().includes(search.toLowerCase()) ||
      String(r.visit_date).includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visits</h1>
          <p className="text-slate-500 text-sm mt-1">Field visit log across all parties</p>
        </div>
        <Link href="/admin" className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          + Log visit
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <Input placeholder="Search by party or date…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Purpose</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Location</th>
                    <th className="pb-2 pr-4 font-medium">Notes</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">{fmt(r.visit_date)}</td>
                      <td className="py-2 pr-4">
                        <Link href={`/parties/${r.party_id}`} className="text-teal-600 hover:underline">{fmt(r.party_name)}</Link>
                      </td>
                      <td className="py-2 pr-4 text-slate-500 capitalize">{fmt(r.party_type)}</td>
                      <td className="py-2 pr-4 text-slate-500">{fmt(r.visit_purpose)?.replace(/_/g, " ")}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[String(r.visit_status)] ?? STATUS_COLORS.completed}`}>
                          {fmt(r.visit_status)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-500">{fmt(r.location_snapshot)}</td>
                      <td className="py-2 pr-4 text-slate-400 max-w-xs truncate">{fmt(r.notes)}</td>
                      <td className="py-2">
                        <Link href={`/visits/${r.id}/edit`} className="text-slate-400 hover:text-teal-600">
                          <Pencil size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-400">No visits found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

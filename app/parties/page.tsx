"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getParties } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const TYPE_COLORS: Record<string, string> = {
  hospital: "bg-blue-100 text-blue-700",
  agency: "bg-purple-100 text-purple-700",
  clinic: "bg-green-100 text-green-700",
  other: "bg-slate-100 text-slate-600",
};

export default function PartiesPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["parties", tab],
    queryFn: () => getParties(tab),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const rows = (data as Record<string, unknown>[] ?? []).filter(
    (r) => !search || String(r.party_name).toLowerCase().includes(search.toLowerCase()) ||
      String(r.city).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parties</h1>
          <p className="text-slate-500 text-sm mt-1">Hospitals, agencies, and other buyers</p>
        </div>
        {isAdmin && (
          <Link href="/admin" className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
            + Add party
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hospital">Hospitals</TabsTrigger>
            <TabsTrigger value="agency">Agencies</TabsTrigger>
            <TabsTrigger value="clinic">Clinics</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <Input placeholder="Search by name or city…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((r) => (
            <Link key={String(r.party_id)} href={`/parties/${r.party_id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{fmt(r.party_name)}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{fmt(r.city)}{r.district ? `, ${r.district}` : ""}</p>
                      {!!r.phone && <p className="text-xs text-slate-400 mt-1">{fmt(r.phone)}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[String(r.party_type)] ?? TYPE_COLORS.other}`}>
                        {fmt(r.party_type)}
                      </span>
                      <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  </div>
                  {!!r.distance_from_base_km && (
                    <p className="text-xs text-slate-400 mt-2">{fmt(r.distance_from_base_km)} km from base</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
          {rows.length === 0 && <p className="text-slate-400 col-span-3 py-8 text-center">No parties found.</p>}
        </div>
      )}
    </div>
  );
}

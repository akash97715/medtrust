"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParty, deleteParty } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Lock } from "lucide-react";

const MASTER_CODE = "97715";

function DataTable({ rows, cols }: { rows: Record<string, unknown>[]; cols: { key: string; label: string; money?: boolean }[] }) {
  if (!rows.length) return <p className="text-slate-400 text-sm py-4">No records.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-slate-500">
            {cols.map((c) => <th key={c.key} className="pb-2 pr-4 text-left font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
              {cols.map((c) => (
                <td key={c.key} className="py-2 pr-4">
                  {c.money ? money(r[c.key] as number) : fmt(r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [pendingAction, setPendingAction] = useState<"edit" | "deactivate" | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const openDialog = (action: "edit" | "deactivate") => { setPendingAction(action); setCode(""); setCodeError(false); };
  const handleCodeSubmit = () => {
    if (code === MASTER_CODE) {
      setPendingAction(null);
      if (pendingAction === "edit") router.push(`/parties/${id}/edit`);
      if (pendingAction === "deactivate") deactivate.mutate();
    } else {
      setCodeError(true);
    }
  };

  const { data, isLoading } = useQuery({ queryKey: ["party", id], queryFn: () => getParty(id), staleTime: 0, refetchOnMount: "always" });
  const deactivate = useMutation({
    mutationFn: () => deleteParty(id),
    onSuccess: () => {
      toast.success("Party deactivated");
      qc.clear();
      router.push("/parties");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  const p = data as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/parties" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
            <ArrowLeft size={14} /> Parties
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{fmt(p?.party_name)}</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">{fmt(p?.party_type)} · {fmt(p?.city)}, {fmt(p?.district)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openDialog("edit")}><Pencil size={14} className="mr-1.5" />Edit</Button>
          <button onClick={() => openDialog("deactivate")} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-md px-3 py-1.5 transition-colors">
            <Trash2 size={14} />Deactivate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 space-y-1 text-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">Contact</p>
          <p><span className="text-slate-400">Phone: </span>{fmt(p?.phone)}</p>
          <p><span className="text-slate-400">Contact: </span>{fmt(p?.contact_person)}</p>
          <p><span className="text-slate-400">Address: </span>{fmt(p?.address_line)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-1 text-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">Location</p>
          <p><span className="text-slate-400">City: </span>{fmt(p?.city)}</p>
          <p><span className="text-slate-400">District: </span>{fmt(p?.district)}</p>
          <p><span className="text-slate-400">State: </span>{fmt(p?.state)}</p>
          <p><span className="text-slate-400">Distance: </span>{fmt(p?.distance_from_base_km)} km</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-1 text-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">Notes</p>
          <p className="text-slate-600">{fmt(p?.notes)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="requested">Requested Items</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        <TabsContent value="visits" className="mt-4">
          <Card><CardContent className="pt-4">
            <DataTable
              rows={(p?.visits as Record<string, unknown>[] ?? [])}
              cols={[
                { key: "visit_date", label: "Date" },
                { key: "visit_purpose", label: "Purpose" },
                { key: "visit_status", label: "Status" },
                { key: "location_snapshot", label: "Location" },
                { key: "notes", label: "Notes" },
              ]}
            />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="requested" className="mt-4">
          <Card><CardContent className="pt-4">
            <DataTable
              rows={(p?.requested_items as Record<string, unknown>[] ?? [])}
              cols={[
                { key: "visit_date", label: "Visit Date" },
                { key: "product_name", label: "Product" },
                { key: "requirement_type", label: "Type" },
                { key: "quantity_estimate", label: "Qty Est." },
                { key: "unit_of_measure", label: "Unit" },
                { key: "brand_preference", label: "Brand" },
              ]}
            />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <Card><CardContent className="pt-4">
            <DataTable
              rows={(p?.orders as Record<string, unknown>[] ?? [])}
              cols={[
                { key: "order_date", label: "Date" },
                { key: "order_status", label: "Status" },
                { key: "product_name", label: "Product" },
                { key: "quantity", label: "Qty" },
                { key: "buy_rate", label: "Buy Rate", money: true },
                { key: "sell_rate", label: "Sell Rate", money: true },
              ]}
            />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="pricing" className="mt-4">
          <Card><CardContent className="pt-4">
            <DataTable
              rows={(p?.pricing as Record<string, unknown>[] ?? [])}
              cols={[
                { key: "product_name", label: "Product" },
                { key: "buy_rate", label: "Buy Rate", money: true },
                { key: "sell_rate", label: "Sell Rate", money: true },
                { key: "currency_code", label: "Currency" },
                { key: "effective_from", label: "From" },
              ]}
            />
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Employee Code Required</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">Enter your employee code to continue.</p>
            <Input type="password" placeholder="Enter code…" value={code} autoFocus
              onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()} />
            {codeError && <p className="text-xs text-red-500 mt-1.5">Invalid employee code. Please try again.</p>}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCodeSubmit} className={`flex-1 ${pendingAction === "deactivate" ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}`}>
                {pendingAction === "deactivate" ? "Deactivate" : "Continue"}
              </Button>
              <Button variant="outline" onClick={() => setPendingAction(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParty, deleteParty } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";

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

function InlineUnlock({ label }: { label: string }) {
  const { tryUnlock } = useAuth();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const handleComplete = async (pin: string) => {
    setLoading(true);
    setError(false);
    const ok = await tryUnlock(pin);
    setLoading(false);
    if (!ok) {
      setError(true);
      setResetPin((v) => v + 1);
    }
  };

  return (
    <Card>
      <CardContent className="pt-8 pb-10">
        <div className="max-w-xs mx-auto text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 mx-auto mb-4">
            <Lock size={20} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">Restricted — {label}</p>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Enter your 5-digit employee code to unlock this section and all restricted content for this session.
          </p>
          <PinInput onComplete={handleComplete} loading={loading} reset={resetPin} />
          {loading && <p className="text-xs text-slate-400 mt-3">Verifying…</p>}
          {error && <p className="text-xs text-red-500 font-medium mt-3">Incorrect code. Try again.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin, tryUnlock } = useAuth();
  const [pendingAction, setPendingAction] = useState<"edit" | "deactivate" | null>(null);
  const [codeError, setCodeError] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const openDialog = (action: "edit" | "deactivate") => {
    setPendingAction(action);
    setCodeError(false);
    setResetPin((v) => v + 1);
  };

  const handleCodeComplete = async (pin: string) => {
    setCodeLoading(true);
    setCodeError(false);
    const ok = await tryUnlock(pin);
    setCodeLoading(false);
    if (ok) {
      setPendingAction(null);
      if (pendingAction === "edit") router.push(`/parties/${id}/edit`);
      if (pendingAction === "deactivate") deactivate.mutate();
    } else {
      setCodeError(true);
      setResetPin((v) => v + 1);
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
          <TabsTrigger value="requested" className="flex items-center gap-1.5">
            Requested Items {!isAdmin && <Lock size={10} className="text-slate-400" />}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            Orders {!isAdmin && <Lock size={10} className="text-slate-400" />}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1.5">
            Pricing {!isAdmin && <Lock size={10} className="text-slate-400" />}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visits" className="mt-4">
          <Card><CardContent className="pt-4">
            <DataTable
              rows={(p?.visits as Record<string, unknown>[] ?? [])}
              cols={[
                { key: "visit_date", label: "Date" },
                { key: "visit_purpose", label: "Purpose" },
                { key: "notes", label: "Notes" },
              ]}
            />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="requested" className="mt-4">
          {isAdmin ? (
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
          ) : <InlineUnlock label="Requested Items" />}
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          {isAdmin ? (
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
          ) : <InlineUnlock label="Orders" />}
        </TabsContent>
        <TabsContent value="pricing" className="mt-4">
          {isAdmin ? (
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
          ) : <InlineUnlock label="Pricing" />}
        </TabsContent>
      </Tabs>

      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 mx-auto mb-3">
              <Lock size={18} className="text-slate-400" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">Employee Code Required</h2>
            <p className="text-xs text-slate-400 mb-5">Enter your 5-digit employee code to continue.</p>
            <PinInput onComplete={handleCodeComplete} loading={codeLoading} reset={resetPin} />
            {codeLoading && <p className="text-xs text-slate-400 mt-3">Verifying…</p>}
            {codeError && <p className="text-xs text-red-500 mt-3 font-medium">Incorrect code. Please try again.</p>}
            <button onClick={() => setPendingAction(null)} className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

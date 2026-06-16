"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getOrder } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText, Lock, Package, Calendar, Building2, Hash, StickyNote } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700 ring-1 ring-green-200",
  delivered: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  payment_received: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
  draft: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  cancelled: "bg-red-100 text-red-600 ring-1 ring-red-200",
};

function fmtDate(d: unknown) {
  if (!d) return "—";
  return new Date(String(d) + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { tryUnlock } = useAuth();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const openDialog = (href: string) => { setPendingHref(href); setPinError(false); setResetPin((v) => v + 1); };
  const handlePin = async (pin: string) => {
    setPinLoading(true); setPinError(false);
    const ok = await tryUnlock(pin);
    setPinLoading(false);
    if (ok) { router.push(pendingHref!); setPendingHref(null); }
    else { setPinError(true); setResetPin((v) => v + 1); }
  };

  const { data, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const o = data as Record<string, unknown>;
  const items = (o?.items as Record<string, unknown>[]) ?? [];
  const cgstRate = Number(o?.cgst_rate) || 6;
  const sgstRate = Number(o?.sgst_rate) || 6;
  const subtotal = items.reduce((s, it) => s + (Number(it.line_value) || 0), 0);
  const cgstAmt = subtotal * (cgstRate / 100);
  const sgstAmt = subtotal * (sgstRate / 100);
  const grandTotal = subtotal + cgstAmt + sgstAmt;
  const status = String(o?.order_status ?? "");

  return (
    <div className="max-w-4xl space-y-6 pb-10">

      {/* Back + actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Order Details</h1>
          <p className="text-slate-500 text-sm mt-0.5">{String(o?.party_name ?? "")} · {fmtDate(o?.order_date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDialog(`/invoices/${id}`)}
            className="flex items-center gap-2 text-sm border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileText size={14} /> Invoice
          </button>
          <button
            onClick={() => openDialog(`/orders/${id}/edit`)}
            className="flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil size={14} /> Edit order
          </button>
        </div>
      </div>

      {/* Order header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-slate-100 shrink-0"><Building2 size={14} className="text-slate-500" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Party</p>
              <Link href={`/parties/${String(o?.party_id ?? "")}`} className="text-sm font-semibold text-slate-800 hover:text-teal-700 transition-colors">
                {String(o?.party_name ?? "—")}
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-slate-100 shrink-0"><Calendar size={14} className="text-slate-500" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Order Date</p>
              <p className="text-sm font-semibold text-slate-800">{fmtDate(o?.order_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-slate-100 shrink-0"><Package size={14} className="text-slate-500" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>
                {status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {!!o?.reference_number && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-slate-100 shrink-0"><Hash size={14} className="text-slate-500" /></div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reference</p>
                <p className="text-sm font-semibold text-slate-800">{String(o.reference_number)}</p>
              </div>
            </div>
          )}
        </div>

        {!!(o?.bill_period_from || o?.bill_period_to) && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Bill Period</p>
            <p className="text-sm text-slate-700">{fmtDate(o?.bill_period_from)} – {fmtDate(o?.bill_period_to)}</p>
          </div>
        )}

        {!!o?.notes && (
          <div className="flex items-start gap-2 pt-3 border-t border-slate-100">
            <StickyNote size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 italic">{String(o.notes)}</p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">Line Items</h2>
          <p className="text-xs text-slate-400 mt-0.5">{items.length} product{items.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500 text-left">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Buy Rate</th>
                <th className="px-4 py-3 font-medium text-right">Sell Rate</th>
                <th className="px-4 py-3 font-medium text-right">Discount</th>
                <th className="px-5 py-3 font-medium text-right">Line Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-800">{fmt(it.product_name)}</td>
                  <td className="px-4 py-3 text-right">{fmt(it.quantity)}</td>
                  <td className="px-4 py-3 text-slate-500">{fmt(it.unit_of_measure)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{money(it.buy_rate as number)}</td>
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">{money(it.sell_rate as number)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {Number(it.discount) > 0 ? `− ${money(it.discount as number)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-teal-700">{money(it.line_value as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>CGST ({cgstRate}%)</span>
              <span className="font-medium">{money(cgstAmt)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>SGST ({sgstRate}%)</span>
              <span className="font-medium">{money(sgstAmt)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-teal-700">{money(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PIN dialog */}
      {pendingHref && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 mx-auto mb-3">
              <Lock size={18} className="text-slate-400" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">Employee Code Required</h2>
            <p className="text-xs text-slate-400 mb-5">Enter your 5-digit employee code to continue.</p>
            <PinInput onComplete={handlePin} loading={pinLoading} reset={resetPin} />
            {pinLoading && <p className="text-xs text-slate-400 mt-3">Verifying…</p>}
            {pinError && <p className="text-xs text-red-500 mt-3 font-medium">Incorrect code. Please try again.</p>}
            <button onClick={() => setPendingHref(null)} className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

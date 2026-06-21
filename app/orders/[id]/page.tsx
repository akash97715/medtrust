"use client";
import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrder, addPayment, deletePayment } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Pencil, FileText, Package, Calendar, Building2, Hash,
  StickyNote, IndianRupee, Banknote, Plus, Trash2, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700 ring-1 ring-green-200",
  delivered: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  partial_payment: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
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

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Payment form state
  const [addingPayment, setAddingPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayStr());
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const o = data as Record<string, unknown>;
  const items = (o?.items as Record<string, unknown>[]) ?? [];
  const payments = (o?.payments as Record<string, unknown>[]) ?? [];
  const cgstRate = Number(o?.cgst_rate) || 6;
  const sgstRate = Number(o?.sgst_rate) || 6;

  // Order financials (invoice-accurate: with discounts)
  const subtotalRaw = items.reduce((s, it) => s + Number(it.quantity) * Number(it.sell_rate || 0), 0);
  const totalDiscount = items.reduce((s, it) => s + Number(it.discount || 0), 0);
  const taxable = subtotalRaw - totalDiscount;
  const cgstAmt = taxable * (cgstRate / 100);
  const sgstAmt = taxable * (sgstRate / 100);
  const grandTotal = taxable + cgstAmt + sgstAmt;

  // Line items subtotal (existing display, no discount deducted — matches current UI)
  const subtotal = items.reduce((s, it) => s + (Number(it.line_value) || 0), 0);

  const totalReceived = Number(o?.total_received || 0);
  const remaining = grandTotal - totalReceived;
  const pctCollected = grandTotal > 0 ? Math.min(Math.round((totalReceived / grandTotal) * 100), 100) : 0;
  const status = String(o?.order_status ?? "");
  const fullyPaid = remaining <= 0.005 && totalReceived > 0 && grandTotal > 0;

  async function handleAddPayment() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError("Enter a valid amount greater than ₹0"); return; }
    // Frontend cap — backend enforces too
    if (grandTotal > 0 && totalReceived + amount > grandTotal + 0.005) {
      const maxAllowed = Math.max(0, grandTotal - totalReceived);
      setPayError(`Cannot exceed order total. Maximum you can record: ${money(maxAllowed)}`);
      return;
    }
    setPayLoading(true); setPayError(null);
    try {
      await addPayment(id, { amount, payment_date: payDate, notes: payNote || undefined });
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["profit"] });
      setAddingPayment(false);
      setPayAmount("");
      setPayNote("");
      setPayDate(todayStr());
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Failed to add payment");
    } finally {
      setPayLoading(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    setDeletingId(paymentId);
    try {
      await deletePayment(paymentId);
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["profit"] });
    } catch { /* ignore */ }
    setDeletingId(null);
  }

  return (
    <div className="max-w-4xl space-y-6 pb-10">

      {/* Page header + actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Details</h1>
          <p className="text-slate-500 text-sm mt-0.5">{String(o?.party_name ?? "")} · {fmtDate(o?.order_date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/${id}`}
            className="flex items-center gap-2 text-sm border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileText size={14} /> Invoice
          </Link>
          <Link
            href={`/orders/${id}/edit`}
            className="flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil size={14} /> Edit order
          </Link>
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
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Discount</span>
                <span className="font-medium text-red-500">− {money(totalDiscount)}</span>
              </div>
            )}
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

      {/* ── Payment Tracker ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <IndianRupee size={14} className="text-teal-600" />
              Payment Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Record cash collections against this order</p>
          </div>
          {!addingPayment && status !== "payment_received" && remaining > 0.005 && (
            <button
              onClick={() => { setAddingPayment(true); setPayError(null); }}
              className="flex items-center gap-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              <Plus size={14} /> Record Payment
            </button>
          )}
        </div>

        {/* Financial summary — 3-column on desktop, stacked on mobile */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Order Total</p>
            <p className="text-xl font-black text-slate-800">{money(grandTotal)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">incl. GST</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Received</p>
            <p className={`text-xl font-black ${totalReceived > 0 ? "text-green-600" : "text-slate-300"}`}>
              {money(totalReceived)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{payments.length} payment{payments.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Remaining</p>
            {fullyPaid ? (
              <p className="text-xl font-black text-green-600 flex items-center gap-1">
                <CheckCircle2 size={18} /> ₹0
              </p>
            ) : (
              <p className="text-xl font-black text-orange-600">{money(Math.max(remaining, 0))}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">{pctCollected}% collected</p>
          </div>
        </div>

        {/* Progress bar */}
        {grandTotal > 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${fullyPaid ? "bg-green-500" : "bg-teal-500"}`}
                style={{ width: `${pctCollected}%` }}
              />
            </div>
            {!fullyPaid && remaining > 0 && (
              <p className="text-[11px] text-slate-400 mt-1.5">{money(remaining)} still outstanding</p>
            )}
          </div>
        )}

        {/* Payment history list */}
        {payments.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {payments.map((p) => (
              <div key={String(p.id)} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 shrink-0">
                    <Banknote size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{money(Number(p.amount))}</p>
                    <p className="text-xs text-slate-400">
                      {fmtDate(p.payment_date)}
                      {!!p.notes && <span className="text-slate-500"> · {String(p.notes)}</span>}
                    </p>
                  </div>
                </div>
                {isAdmin && status !== "payment_received" && (
                  <button
                    onClick={() => handleDeletePayment(String(p.id))}
                    disabled={deletingId === String(p.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete payment"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <Banknote size={16} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">No payments recorded yet</p>
            <p className="text-xs text-slate-300 mt-0.5">Use "Record Payment" to log each cash instalment</p>
          </div>
        )}

        {/* Add payment inline form */}
        {addingPayment && (
          <div className="border-t border-slate-100 p-5 bg-slate-50/50">
            <p className="text-sm font-semibold text-slate-700 mb-3">Record New Payment</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="e.g. 3000"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. advance, part payment"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                />
              </div>
            </div>
            {payError && <p className="text-xs text-red-500 mt-2">{payError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddPayment}
                disabled={payLoading || !payAmount}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {payLoading ? "Saving…" : <><Plus size={14} /> Add Payment</>}
              </button>
              <button
                onClick={() => { setAddingPayment(false); setPayAmount(""); setPayNote(""); setPayError(null); }}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status banners */}
        {status === "payment_received" && totalReceived > 0 && (
          <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <p className="text-sm text-emerald-700 font-medium">Payment fully received — order closed</p>
          </div>
        )}
        {status === "payment_received" && totalReceived <= 0 && (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ This order is marked as "Payment Received" but no cash payments have been logged here.
            </p>
            <p className="text-xs text-amber-700 mt-1">
              If payments were collected, use <strong>Record Payment</strong> above to log each instalment with the date and amount.
            </p>
          </div>
        )}
        {status === "partial_payment" && (
          <div className="border-t border-orange-100 bg-orange-50 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-orange-800 font-medium">
              Partial payment in progress · {money(remaining)} still outstanding
            </p>
            {!addingPayment && (
              <button
                onClick={() => { setAddingPayment(true); setPayError(null); }}
                className="text-sm text-orange-700 underline underline-offset-2 hover:text-orange-900"
              >
                Record next payment →
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

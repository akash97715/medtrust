"use client";
import { useQuery } from "@tanstack/react-query";
import { getOrder, getParty } from "@/lib/api";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

const COMPANY = {
  name: "MEDTRUST HEALTHCARE",
  tagline: "Medical & Surgical Supply Distributors",
  gst: "29EYSPS5133L1ZF",
  udyam: "UDYAM-KR-03-0706248",
  bank: "Bank of Maharashtra",
  account: "60528282863",
  ifsc: "MAHB0002126",
};

function fmt(v: unknown) { return v == null ? "—" : String(v); }
function money(v: unknown) {
  const n = Number(v);
  return isNaN(n) ? "—" : `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: unknown) {
  if (!d) return "—";
  const dt = new Date(String(d));
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function invoiceNo(id: unknown) {
  return `MT-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`;
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });

  const o = order as Record<string, unknown> | undefined;
  const partyId = o?.party_id;

  const { data: partyData } = useQuery({
    queryKey: ["party", partyId],
    queryFn: () => getParty(String(partyId)),
    enabled: !!partyId,
  });
  const party = partyData as Record<string, unknown> | undefined;

  const qty = Number(o?.quantity ?? 0);
  const rate = Number(o?.sell_rate ?? 0);
  const subtotal = qty * rate;
  const total = subtotal;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading invoice…</p>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
          @page { size: A4; margin: 12mm 14mm; }
        }
      `}</style>

      {/* Controls — hidden on print */}
      <div className="no-print bg-slate-100 min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={15} /> Back to Orders
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#0c1220] hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

        {/* ── INVOICE DOCUMENT ── */}
        <div className="invoice-page max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#0c1220] px-8 pt-8 pb-6">
            <div className="flex items-start justify-between">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
                    <span className="text-white font-black text-base">M</span>
                  </div>
                  <div>
                    <p className="text-white font-black text-xl tracking-tight leading-none">{COMPANY.name}</p>
                    <p className="text-teal-400 text-[11px] font-semibold tracking-wide mt-0.5">{COMPANY.tagline}</p>
                  </div>
                </div>
                <div className="space-y-0.5 ml-1">
                  <p className="text-white/50 text-[11px] font-mono">GST: <span className="text-white/80 font-semibold">{COMPANY.gst}</span></p>
                  <p className="text-white/50 text-[11px] font-mono">Udyam: <span className="text-white/80 font-semibold">{COMPANY.udyam}</span></p>
                </div>
              </div>

              {/* Invoice label */}
              <div className="text-right">
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Tax Invoice</p>
                <p className="text-white font-black text-2xl tracking-tight">{invoiceNo(o?.order_id)}</p>
                <p className="text-white/50 text-xs mt-1">Date: <span className="text-white/80">{fmtDate(o?.order_date)}</span></p>
                {o?.reference_number && (
                  <p className="text-white/40 text-[11px] mt-0.5">Ref: {fmt(o.reference_number)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Teal accent bar */}
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-600" />

          {/* Bill To + Order Info */}
          <div className="grid grid-cols-2 gap-0 border-b border-slate-100">
            {/* Bill To */}
            <div className="px-8 py-6 border-r border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Bill To</p>
              <p className="font-black text-slate-800 text-base leading-tight">{fmt(o?.party_name)}</p>
              {party?.party_type && (
                <p className="text-teal-600 text-xs font-semibold capitalize mt-0.5">{fmt(party.party_type)}</p>
              )}
              <div className="mt-2 space-y-0.5">
                {party?.address_line && <p className="text-slate-500 text-xs">{fmt(party.address_line)}</p>}
                {(party?.city || party?.district) && (
                  <p className="text-slate-500 text-xs">
                    {[party.city, party.district, party.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {party?.contact_person && (
                  <p className="text-slate-500 text-xs">Attn: {fmt(party.contact_person)}</p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="px-8 py-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Order Details</p>
              <div className="space-y-2">
                {[
                  { label: "Invoice No", value: invoiceNo(o?.order_id) },
                  { label: "Order Date", value: fmtDate(o?.order_date) },
                  { label: "Status", value: fmt(o?.order_status).toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">{label}</span>
                    <span className={`text-xs font-bold ${label === "Status" ? "text-teal-600" : "text-slate-700"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="text-left pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 w-8">#</th>
                  <th className="text-left pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Description</th>
                  <th className="text-right pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 w-20">Qty</th>
                  <th className="text-right pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 w-16">Unit</th>
                  <th className="text-right pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 w-28">Rate</th>
                  <th className="text-right pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="py-4 text-slate-400 text-sm">1</td>
                  <td className="py-4">
                    <p className="font-bold text-slate-800">{fmt(o?.product_name)}</p>
                    {o?.notes && <p className="text-slate-400 text-xs mt-0.5">{fmt(o.notes)}</p>}
                  </td>
                  <td className="py-4 text-right font-semibold text-slate-700">{fmt(o?.quantity)}</td>
                  <td className="py-4 text-right text-slate-500 text-xs">{fmt(o?.unit_of_measure)}</td>
                  <td className="py-4 text-right font-semibold text-slate-700">{money(o?.sell_rate)}</td>
                  <td className="py-4 text-right font-bold text-slate-800">{money(subtotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-700">{money(subtotal)}</span>
                </div>
                <div className="border-t-2 border-[#0c1220] pt-2 mt-2 flex justify-between">
                  <span className="font-black text-slate-800 text-base">Total Payable</span>
                  <span className="font-black text-teal-600 text-base">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mx-8 mb-6 rounded-xl bg-slate-50 border border-slate-100 px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Payment Details</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Bank Name", value: COMPANY.bank },
                { label: "Account Number", value: COMPANY.account },
                { label: "IFSC Code", value: COMPANY.ifsc },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 font-semibold mb-0.5">{label}</p>
                  <p className="font-black text-slate-800 text-sm font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer — Signature */}
          <div className="grid grid-cols-2 border-t border-slate-100 mx-8 mb-8 pt-6">
            {/* Terms */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Note</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Please make payment to the bank account above. Quote invoice number in your transfer reference.
              </p>
            </div>

            {/* Seal */}
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Authorised Signatory</p>
              {/* Seal placeholder */}
              <div className="inline-flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-2">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center mx-auto mb-1">
                      <span className="text-teal-600 font-black text-sm">M</span>
                    </div>
                    <p className="text-slate-300 text-[9px] font-bold">SEAL</p>
                  </div>
                </div>
                <p className="text-slate-600 font-black text-xs">{COMPANY.name}</p>
                <p className="text-slate-400 text-[10px]">Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="h-1 bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600" />
          <div className="bg-[#0c1220] px-8 py-3 flex items-center justify-between">
            <p className="text-white/30 text-[10px] font-mono">GST: {COMPANY.gst} · Udyam: {COMPANY.udyam}</p>
            <p className="text-white/20 text-[10px]">This is a computer-generated invoice</p>
          </div>
        </div>
      </div>
    </>
  );
}

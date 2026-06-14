"use client";
import { useQuery } from "@tanstack/react-query";
import { getOrder, getParty } from "@/lib/api";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Update these constants with your details ──────────────────
const COMPANY = {
  name: "MEDTRUST HEALTHCARE",
  tagline: "Medical & Surgical Supply Distributors",
  gst: "29EYSPS5133L1ZF",
  udyam: "UDYAM-KR-03-0706248",
  bank: "Bank of Maharashtra",
  account: "60528282863",
  ifsc: "MAHB0002126",
  upi: "medtrusthealthcare12@okicici",   // ← update with your actual UPI ID
};

function fmt(v: unknown) { return v == null ? "—" : String(v); }
function money(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: unknown) {
  if (!d) return "—";
  const dt = new Date(String(d));
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function invoiceNo(id: unknown) {
  return `MT-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`;
}
function upiQr(upiId: string, amount: number, name: string) {
  const data = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=110x110&margin=4&color=0c1220`;
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });

  const o = order as Record<string, unknown> | undefined;
  const items = (o?.items as Record<string, unknown>[]) ?? [];
  const partyId = o?.party_id;

  const { data: partyData } = useQuery({
    queryKey: ["party", partyId],
    queryFn: () => getParty(String(partyId)),
    enabled: !!partyId,
  });
  const party = partyData as Record<string, unknown> | undefined;

  // Calculate totals from all line items
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.quantity ?? 0) * Number(item.sell_rate ?? 0);
  }, 0);
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
      <style>{`
        @media print {
          body { background: white !important; margin: 0; }
          .no-print { display: none !important; }
          .invoice-wrapper { background: white !important; padding: 0 !important; }
          .invoice-page { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      {/* ── Controls (hidden on print) ── */}
      <div className="no-print bg-slate-100 px-4 pt-6 pb-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
      </div>

      {/* ── Invoice document (always visible, including in print) ── */}
      <div className="invoice-wrapper bg-slate-100 px-4 pb-10 pt-3">
        <div className="invoice-page max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-[#0c1220] px-8 pt-7 pb-6">
            <div className="flex items-start justify-between">
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

          {/* Accent line */}
          <div className="h-[3px] bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600" />

          {/* ── Bill To + Order Info ── */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            <div className="px-8 py-5 border-r border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">Bill To</p>
              <p className="font-black text-slate-800 text-base leading-tight">{fmt(o?.party_name)}</p>
              {party?.party_type && (
                <p className="text-teal-600 text-xs font-semibold capitalize mt-0.5">{fmt(party.party_type)}</p>
              )}
              <div className="mt-1.5 space-y-0.5">
                {party?.address_line && <p className="text-slate-500 text-xs">{fmt(party.address_line)}</p>}
                {(party?.city || party?.district) && (
                  <p className="text-slate-500 text-xs">{[party.city, party.district, party.state].filter(Boolean).join(", ")}</p>
                )}
                {party?.contact_person && (
                  <p className="text-slate-500 text-xs">Attn: {fmt(party.contact_person)}</p>
                )}
              </div>
            </div>
            <div className="px-8 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">Invoice Details</p>
              <div className="space-y-1.5">
                {[
                  { label: "Invoice No", value: invoiceNo(o?.order_id) },
                  { label: "Date", value: fmtDate(o?.order_date) },
                  { label: "Status", value: fmt(o?.order_status).toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-400 text-xs">{label}</span>
                    <span className={`text-xs font-bold ${label === "Status" ? "text-teal-600" : "text-slate-700"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="px-8 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="text-left pb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-7">#</th>
                  <th className="text-left pb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Description</th>
                  <th className="text-right pb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-16">Qty</th>
                  <th className="text-right pb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-14">Unit</th>
                  <th className="text-right pb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-24">Rate</th>
                  <th className="text-right pb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, i) => {
                  const qty = Number(item.quantity ?? 0);
                  const rate = Number(item.sell_rate ?? 0);
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="py-3">
                        <p className="font-bold text-slate-800">{fmt(item.product_name)}</p>
                        {item.notes && <p className="text-slate-400 text-xs mt-0.5">{fmt(item.notes)}</p>}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-700">{qty}</td>
                      <td className="py-3 text-right text-slate-500 text-xs">{fmt(item.unit_of_measure)}</td>
                      <td className="py-3 text-right font-semibold text-slate-700">{money(rate)}</td>
                      <td className="py-3 text-right font-bold text-slate-800">{money(qty * rate)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-sm">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-3">
              <div className="w-56 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-700">{money(subtotal)}</span>
                </div>
                <div className="border-t-2 border-slate-800 pt-2 flex justify-between">
                  <span className="font-black text-slate-800">Total Payable</span>
                  <span className="font-black text-teal-600 text-base">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment Details ── */}
          <div className="mx-8 mb-5 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-2 border-b border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Payment Details</p>
            </div>
            <div className="grid grid-cols-[1fr_auto] divide-x divide-slate-200">
              {/* Bank + UPI text */}
              <div className="px-5 py-4 space-y-4">
                {/* Bank */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Bank Transfer</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Bank", value: COMPANY.bank },
                      { label: "Account No.", value: COMPANY.account },
                      { label: "IFSC", value: COMPANY.ifsc },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">{label}</p>
                        <p className="font-black text-slate-800 text-[13px] font-mono">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* UPI */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5">UPI Payment</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5">
                      <p className="font-mono font-black text-teal-700 text-sm">{COMPANY.upi}</p>
                    </div>
                    <p className="text-slate-400 text-xs">Scan QR or pay to this UPI ID</p>
                  </div>
                </div>
              </div>
              {/* QR Code */}
              <div className="px-5 py-4 flex flex-col items-center justify-center gap-1.5">
                <Image
                  src={upiQr(COMPANY.upi, total, COMPANY.name)}
                  alt="UPI QR Code"
                  width={110}
                  height={110}
                  className="rounded-lg border border-slate-200"
                  unoptimized
                />
                <p className="text-[10px] text-slate-400 font-semibold text-center">Scan to Pay</p>
                <p className="text-[10px] text-teal-600 font-black">{money(total)}</p>
              </div>
            </div>
          </div>

          {/* ── Signature ── */}
          <div className="grid grid-cols-2 mx-8 mb-8 pt-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Note</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Please quote the invoice number in your transfer reference. Payment due upon receipt.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Authorised Signatory</p>
              <div className="inline-flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-2">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center mx-auto mb-0.5">
                      <span className="text-teal-600 font-black text-sm">M</span>
                    </div>
                    <p className="text-slate-300 text-[9px] font-bold tracking-wide">SEAL</p>
                  </div>
                </div>
                <p className="text-slate-700 font-black text-xs">{COMPANY.name}</p>
                <p className="text-slate-400 text-[10px]">Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="h-[3px] bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600" />
          <div className="bg-[#0c1220] px-8 py-3 flex items-center justify-between">
            <p className="text-white/30 text-[10px] font-mono">GST: {COMPANY.gst} · Udyam: {COMPANY.udyam}</p>
            <p className="text-white/20 text-[10px]">This is a computer-generated invoice</p>
          </div>
        </div>
      </div>
    </>
  );
}

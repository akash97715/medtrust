"use client";
import { useQuery } from "@tanstack/react-query";
import { getOrder, getParty } from "@/lib/api";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Company constants ──────────────────────────────────────────
const CO = {
  name:    "MEDTRUST HEALTHCARE",
  tagline: "Medical & Surgical Supply Distributors",
  gst:     "29EYSPS5133L1ZF",
  udyam:   "UDYAM-KR-03-0706248",
  bank:    "BANK OF MAHARASHTRA",
  account: "60528282863",
  ifsc:    "MAHB0002126",
  upi:     "medtrusthealthcare12@okicici",  // ← update with real UPI ID
};

// GST rate — change to 0.05 or 0.12 if applicable for your products
const GST_RATE = 0.12; // 12% → CGST 6% + SGST 6%

// ── Helpers ────────────────────────────────────────────────────
function fmt(v: unknown) { return v == null || v === "" ? "—" : String(v); }
function n(v: unknown) { return Number(v) || 0; }
function money(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: unknown) {
  if (!d) return "—";
  const dt = new Date(String(d));
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function invoiceNo(id: unknown) {
  return `MT/${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}/${String(id).padStart(4, "0")}`;
}

// Amount in words (Indian numbering)
const W1 = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const W10 = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
function twoDigits(x: number) {
  return x < 20 ? W1[x] : W10[Math.floor(x / 10)] + (x % 10 ? " " + W1[x % 10] : "");
}
function amountInWords(amount: number): string {
  const intPart = Math.round(amount);
  if (intPart === 0) return "ZERO RUPEES ONLY";
  const cr = Math.floor(intPart / 10000000);
  const lk = Math.floor((intPart % 10000000) / 100000);
  const th = Math.floor((intPart % 100000) / 1000);
  const hu = Math.floor((intPart % 1000) / 100);
  const re = intPart % 100;
  let s = "";
  if (cr) s += twoDigits(cr) + " CRORE ";
  if (lk) s += twoDigits(lk) + " LAKH ";
  if (th) s += twoDigits(th) + " THOUSAND ";
  if (hu) s += W1[hu] + " HUNDRED ";
  if (re) s += (s ? "AND " : "") + twoDigits(re);
  return s.trim() + " RUPEES ONLY";
}

function upiQr(upiId: string, amount: number) {
  const data = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(CO.name)}&am=${amount.toFixed(2)}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=100x100&margin=4&color=0c1220`;
}

// ── Cell helper ────────────────────────────────────────────────
function Td({ children, right, bold, small, gray }: {
  children: React.ReactNode; right?: boolean; bold?: boolean; small?: boolean; gray?: boolean;
}) {
  return (
    <td className={`border border-slate-300 px-2 py-1.5 ${right ? "text-right" : "text-left"} ${bold ? "font-bold" : ""} ${small ? "text-[11px]" : "text-xs"} ${gray ? "bg-slate-50 text-slate-500" : "text-slate-800"}`}>
      {children}
    </td>
  );
}
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`border border-slate-300 bg-[#b8cce4] px-2 py-2 text-[11px] font-bold text-slate-700 ${right ? "text-right" : "text-center"}`}>
      {children}
    </th>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });
  const o = order as Record<string, unknown> | undefined;
  const items = (o?.items as Record<string, unknown>[]) ?? [];

  const { data: partyData } = useQuery({
    queryKey: ["party", o?.party_id],
    queryFn: () => getParty(String(o?.party_id)),
    enabled: !!o?.party_id,
  });
  const party = partyData as Record<string, unknown> | undefined;

  // Calculations — discount now comes from each order item
  const subtotal    = items.reduce((s, it) => s + n(it.quantity) * n(it.sell_rate), 0);
  const discount    = items.reduce((s, it) => s + n(it.discount), 0);
  const taxable     = subtotal - discount;
  const cgst        = taxable * (GST_RATE / 2);
  const sgst        = taxable * (GST_RATE / 2);
  const grandTotal  = taxable + cgst + sgst;

  if (isLoading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Loading invoice…</p>
    </div>
  );

  const partyAddress = [party?.address_line, party?.city, party?.district, party?.state]
    .filter(Boolean).join(", ");

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; margin: 0; }
          .no-print { display: none !important; }
          .invoice-wrapper { background: white !important; padding: 0 !important; }
          .invoice-page { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
          @page { size: A4 portrait; margin: 8mm 10mm; }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print bg-slate-100 px-4 pt-6 pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft size={15} /> Back to Orders
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#0c1220] hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="invoice-wrapper bg-slate-100 px-4 pb-10 pt-3">
        <div className="invoice-page max-w-4xl mx-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden font-sans">

          {/* ── Title bar ── */}
          <div className="bg-[#b8cce4] text-center py-2 border-b border-slate-300">
            <h1 className="text-base font-black text-slate-800 tracking-wide">Tax Invoice</h1>
          </div>

          {/* ── Invoice meta ── */}
          <div className="grid grid-cols-2 border-b border-slate-300">
            <div className="px-4 py-2 border-r border-slate-300 space-y-0.5">
              <p className="text-xs"><span className="font-bold">Invoice No :</span> {invoiceNo(o?.order_id)}</p>
              <p className="text-xs"><span className="font-bold">Invoice date :</span> {fmtDate(o?.order_date)}</p>
              {(o?.bill_period_from || o?.bill_period_to) && (
                <p className="text-xs"><span className="font-bold">Bill Period :</span> {fmtDate(o?.bill_period_from)} TO {fmtDate(o?.bill_period_to)}</p>
              )}
            </div>
            <div className="px-4 py-2 space-y-0.5">
              <p className="text-[11px] text-slate-500">GSTIN: <span className="font-bold text-slate-700">{CO.gst}</span></p>
              <p className="text-[11px] text-slate-500">Udyam: <span className="font-bold text-slate-700">{CO.udyam}</span></p>
            </div>
          </div>

          {/* ── Bill to Party ── */}
          <div className="border-b border-slate-300">
            <div className="bg-[#b8cce4] px-4 py-1 border-b border-slate-300">
              <p className="text-[11px] font-black text-slate-700">Bill to Party</p>
            </div>
            <div className="px-4 py-2">
              <p className="text-sm font-black text-slate-800">Name : {fmt(o?.party_name)}</p>
              {partyAddress && <p className="text-xs text-slate-600 mt-0.5">Address: {partyAddress}</p>}
              {party?.contact_person && <p className="text-xs text-slate-600">Attn: {fmt(party.contact_person)}</p>}
              {(party as Record<string, unknown>)?.gst_number
                ? <p className="text-xs text-slate-600 mt-0.5">GSTIN: {fmt((party as Record<string, unknown>).gst_number)}</p>
                : <p className="text-xs text-slate-400 mt-0.5 italic">GSTIN: Not provided</p>
              }
            </div>
          </div>

          {/* ── Items table ── */}
          <div className="px-4 py-3 border-b border-slate-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>SL.No</Th>
                  <Th>Product Description</Th>
                  <Th>HSN Code</Th>
                  <Th right>Qty</Th>
                  <Th right>Rate</Th>
                  <Th right>Amount</Th>
                  <Th right>Discount</Th>
                  <Th right>Taxable Value</Th>
                  <Th right>Total</Th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, i) => {
                  const qty    = n(item.quantity);
                  const rate   = n(item.sell_rate);
                  const amount = qty * rate;
                  const disc   = n(item.discount);
                  const taxVal = amount - disc;
                  return (
                    <tr key={i}>
                      <Td>{i + 1}</Td>
                      <Td><span className="font-semibold">{fmt(item.product_name)}</span></Td>
                      <Td>{fmt(item.hsn_code)}</Td>
                      <Td right>{qty}</Td>
                      <Td right>{rate.toLocaleString("en-IN")}</Td>
                      <Td right>{amount.toLocaleString("en-IN")}</Td>
                      <Td right>{disc}</Td>
                      <Td right>{taxVal.toLocaleString("en-IN")}</Td>
                      <Td right bold>{taxVal.toLocaleString("en-IN")}</Td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <Td>{""}</Td>
                    <Td>{""}</Td><Td>{""}</Td><Td right>{""}</Td><Td right>{""}</Td>
                    <Td right>{""}</Td><Td right>{""}</Td><Td right>{""}</Td><Td right>{""}</Td>
                  </tr>
                )}
                {/* Total row */}
                <tr className="bg-slate-50">
                  <td colSpan={3} className="border border-slate-300 px-2 py-1.5 text-xs font-black text-center text-slate-700">Total</td>
                  <Td right bold>{items.reduce((s, it) => s + n(it.quantity), 0)}</Td>
                  <Td right>{""}</Td>
                  <Td right bold>{subtotal.toLocaleString("en-IN")}</Td>
                  <Td right bold>{discount}</Td>
                  <Td right bold>{taxable.toLocaleString("en-IN")}</Td>
                  <Td right bold>{taxable.toLocaleString("en-IN")}</Td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Amount in words + GST breakdown ── */}
          <div className="grid grid-cols-[1fr_280px] border-b border-slate-300">
            {/* Left: amount in words */}
            <div className="border-r border-slate-300">
              <div className="bg-[#b8cce4] px-4 py-1 border-b border-slate-300">
                <p className="text-[11px] font-black text-slate-700">Total Invoice amount in words</p>
              </div>
              <div className="px-4 py-4 flex items-center min-h-[80px]">
                <p className="text-xs font-bold text-slate-700 uppercase leading-relaxed">
                  {amountInWords(grandTotal)}
                </p>
              </div>
            </div>
            {/* Right: GST table */}
            <div>
              <table className="w-full border-collapse h-full">
                <tbody>
                  {[
                    { label: "Total Amount before Tax", value: money(taxable) },
                    { label: `CGST @ ${(GST_RATE / 2 * 100).toFixed(0)}%`, value: money(cgst) },
                    { label: `SGST @ ${(GST_RATE / 2 * 100).toFixed(0)}%`, value: money(sgst) },
                    { label: "IGST @ 18%", value: "-" },
                    { label: "Grand total", value: money(grandTotal), bold: true },
                    { label: "GST on Reverse Charge", value: "-" },
                  ].map(({ label, value, bold }) => (
                    <tr key={label}>
                      <td className={`border border-slate-300 px-3 py-1 text-[11px] ${bold ? "font-black bg-slate-50" : "text-slate-600"}`}>{label}</td>
                      <td className={`border border-slate-300 px-3 py-1 text-[11px] text-right ${bold ? "font-black text-slate-800" : "text-slate-700"}`}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Bank Details + Certification ── */}
          <div className="grid grid-cols-[1fr_280px] border-b border-slate-300">
            {/* Bank */}
            <div className="border-r border-slate-300">
              <div className="bg-[#b8cce4] px-4 py-1 border-b border-slate-300">
                <p className="text-[11px] font-black text-slate-700">Bank Details</p>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs"><span className="font-bold">Bank Name :</span> {CO.bank}</p>
                  <p className="text-xs"><span className="font-bold">Bank A/C :</span> {CO.account}</p>
                  <p className="text-xs"><span className="font-bold">Bank IFSC :</span> {CO.ifsc}</p>
                  <p className="text-xs"><span className="font-bold">GSTIN :</span> {CO.gst}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <Image
                    src={upiQr(CO.upi, grandTotal)}
                    alt="UPI QR"
                    width={90}
                    height={90}
                    className="rounded border border-slate-200"
                    unoptimized
                  />
                  <p className="text-[10px] font-bold text-slate-500">UPI: {CO.upi}</p>
                  <p className="text-[10px] text-teal-600 font-black">Scan to Pay {money(grandTotal)}</p>
                </div>
              </div>
            </div>

            {/* Certification */}
            <div className="px-4 py-3 flex flex-col justify-between">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Certified that the particulars given above are true and correct
              </p>
              <div className="mt-4">
                <p className="text-[11px] font-black text-slate-700 text-right">FOR, {CO.name}</p>
                {/* Seal area */}
                <div className="flex justify-end mt-2">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center mx-auto">
                        <span className="text-teal-700 font-black text-xs">M</span>
                      </div>
                      <p className="text-slate-300 text-[8px] font-bold mt-0.5">SEAL</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom strip ── */}
          <div className="grid grid-cols-3 border-t border-slate-300">
            {["Terms & conditions", "Common Seal", "Authorised signatory"].map((label, i) => (
              <div
                key={label}
                className={`px-4 py-3 text-center ${i < 2 ? "border-r border-slate-300" : ""}`}
              >
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{label}</p>
                <div className="h-10" />
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParties, getProducts, createOrder } from "@/lib/api";
import { cleanPayload } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

// ── Bilingual tooltip ────────────────────────────────────────────
function Tip({ en, hi }: { en: string; hi: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1 cursor-help">
      <Info size={12} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 z-50 w-56 bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl leading-relaxed">
        <span className="block font-semibold">{en}</span>
        <span className="block text-white/60 mt-0.5">{hi}</span>
      </span>
    </span>
  );
}

// ── Field wrapper ────────────────────────────────────────────────
function Field({ label, en, hi, children, hint }: {
  label: string; en: string; hi: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 flex items-center">
        {label}
        <Tip en={en} hi={hi} />
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Section divider ──────────────────────────────────────────────
function Section({ title }: { title: string }) {
  return (
    <div className="pt-2 pb-1">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">{title}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function AddOrderPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: parties, isLoading: lp } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  const { data: products, isLoading: lprod } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    defaultValues: { order_status: "confirmed", unit_of_measure: "piece", discount: 0, cgst_rate: 6, sgst_rate: 6 },
  });

  const mut = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success("Order saved");
      qc.invalidateQueries({ queryKey: ["orders"] });
      reset();
      router.push(`/parties/${(data as { party_id: string }).party_id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Order</h1>
        <p className="text-slate-500 text-sm mt-0.5">ऑर्डर जोड़ें · Confirmed orders only</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 font-medium">Confirmed business only</p>
        <p className="text-xs text-amber-600 mt-0.5">Saving updates party-wise product pricing automatically.</p>
      </div>

      <form onSubmit={handleSubmit((v) => mut.mutate(cleanPayload(v as Record<string, unknown>)))} className="space-y-4">

        {/* ── Party & Product ── */}
        <Section title="Party & Product" />

        <Field label="Party *" en="Select the hospital, clinic or agency placing this order." hi="वह हॉस्पिटल या एजेंसी चुनें जो यह ऑर्डर दे रही है।">
          {lp ? <Skeleton className="h-10" /> : (
            <Select onValueChange={(v) => setValue("party_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select party…" /></SelectTrigger>
              <SelectContent>
                {(parties as Record<string, unknown>[] ?? []).map((p) => (
                  <SelectItem key={String(p.party_id)} value={String(p.party_id)}>
                    {String(p.party_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.party_id && <p className="text-xs text-red-500 mt-0.5">Party is required</p>}
        </Field>

        <Field label="Product *" en="The medical/surgical product being ordered." hi="जो मेडिकल या सर्जिकल सामान ऑर्डर किया जा रहा है।">
          {lprod ? <Skeleton className="h-10" /> : (
            <Select onValueChange={(v) => setValue("product_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
              <SelectContent>
                {(products as Record<string, unknown>[] ?? []).map((p) => (
                  <SelectItem key={String(p.product_id)} value={String(p.product_id)}>
                    {String(p.product_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.product_id && <p className="text-xs text-red-500 mt-0.5">Product is required</p>}
        </Field>

        {/* ── Order Details ── */}
        <Section title="Order Details" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Order date *" en="The date this order was confirmed." hi="जिस तारीख को यह ऑर्डर कन्फर्म हुआ।">
            <Input type="date" {...register("order_date", { required: true })} />
            {errors.order_date && <p className="text-xs text-red-500 mt-0.5">Date is required</p>}
          </Field>
          <Field label="Status" en="Current status of this order." hi="इस ऑर्डर की अभी की स्थिति।">
            <Select onValueChange={(v) => setValue("order_status", v)} defaultValue="confirmed">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bill Period From" en="Start date of the service/supply period for this invoice." hi="इनवॉइस के लिए सप्लाई या सेवा की शुरुआत की तारीख।">
            <Input type="date" {...register("bill_period_from")} />
          </Field>
          <Field label="Bill Period To" en="End date of the service/supply period for this invoice." hi="इनवॉइस के लिए सप्लाई या सेवा की समाप्ति की तारीख।">
            <Input type="date" {...register("bill_period_to")} />
          </Field>
        </div>

        {/* ── Quantity & Pricing ── */}
        <Section title="Quantity & Pricing" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity *" en="How many units are being ordered." hi="कितनी मात्रा का ऑर्डर है।">
            <Input type="number" step="0.01" {...register("quantity", { required: true })} placeholder="100" />
            {errors.quantity && <p className="text-xs text-red-500 mt-0.5">Required</p>}
          </Field>
          <Field label="Unit" en="Unit of measurement — e.g. piece, box, strip, kg." hi="माप की इकाई — जैसे पीस, बॉक्स, स्ट्रिप, किलो।">
            <Input {...register("unit_of_measure")} defaultValue="piece" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Buy rate" en="Your cost price — what you paid to the supplier." hi="आपकी लागत कीमत — आपने सप्लायर को कितना दिया।">
            <Input type="number" step="0.01" {...register("buy_rate")} placeholder="0.00" />
          </Field>
          <Field label="Sell rate *" en="Price charged to the party. This appears on the invoice." hi="पार्टी को जो कीमत चार्ज की गई। यही इनवॉइस पर दिखेगी।">
            <Input type="number" step="0.01" {...register("sell_rate", { required: true })} placeholder="0.00" />
            {errors.sell_rate && <p className="text-xs text-red-500 mt-0.5">Sell rate is required</p>}
          </Field>
        </div>

        <Field label="Discount (₹)" en="Discount amount in rupees to be deducted from taxable value." hi="छूट की रकम (रुपये में) जो टैक्सेबल वैल्यू से घटाई जाएगी।">
          <Input type="number" step="0.01" {...register("discount")} placeholder="0" />
        </Field>

        {/* ── Invoice Details ── */}
        <Section title="Invoice Details" />

        <Field label="HSN Code" en="Harmonised System of Nomenclature code for the product — required for GST invoices. E.g. 3004 for medicines, 9018 for surgical instruments." hi="प्रोडक्ट का HSN कोड — GST इनवॉइस के लिए जरूरी है। जैसे दवाओं के लिए 3004, सर्जिकल उपकरणों के लिए 9018।">
          <Input {...register("hsn_code")} placeholder="e.g. 3004" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CGST %" en="Central GST rate as a percentage. Common rates: 0%, 2.5%, 6%, 9%. For medicines it is usually 6% (total GST 12%)." hi="केंद्रीय GST की दर प्रतिशत में। सामान्य दरें: 0%, 2.5%, 6%, 9%। दवाओं पर आमतौर पर 6% (कुल GST 12%) होता है।">
            <Input type="number" step="0.01" min="0" max="28" {...register("cgst_rate")} placeholder="6" />
          </Field>
          <Field label="SGST %" en="State GST rate as a percentage. Must equal CGST rate for intra-state sales. For inter-state sales use IGST instead." hi="राज्य GST की दर प्रतिशत में। राज्य के अंदर की बिक्री के लिए CGST के बराबर होती है। राज्य के बाहर की बिक्री के लिए IGST लगती है।">
            <Input type="number" step="0.01" min="0" max="28" {...register("sgst_rate")} placeholder="6" />
          </Field>
        </div>

        <Field label="Reference number" en="Optional PO number, challan number or any internal reference." hi="वैकल्पिक PO नंबर, चालान नंबर या कोई आंतरिक संदर्भ।">
          <Input {...register("reference_number")} placeholder="Optional PO or ref" />
        </Field>

        <Field label="Notes" en="Any additional details — special instructions, delivery notes, etc." hi="कोई अतिरिक्त जानकारी — विशेष निर्देश, डिलीवरी नोट्स आदि।">
          <Textarea {...register("notes")} rows={3} />
        </Field>

        <div className="pt-2 pb-6">
          <Button type="submit" className="w-full h-11 text-base" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, getStock } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cleanPayload } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type StockRow = {
  product_id: string;
  product_name: string;
  product_category: string | null;
  unit_of_measure: string;
  stock_quantity: number;
  last_updated_at: string | null;
};

// ── Fuzzy similarity (bigram Dice coefficient) ────────────────────────────────
// Handles typos, spacing, case — no external library needed.
function normalizeStr(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}
function bigrams(s: string): Set<string> {
  const n = normalizeStr(s);
  const out = new Set<string>();
  for (let i = 0; i < n.length - 1; i++) out.add(n.slice(i, i + 2));
  return out;
}
function diceSim(a: string, b: string): number {
  const ba = bigrams(a), bb = bigrams(b);
  if (ba.size === 0 && bb.size === 0) return 1;
  if (ba.size === 0 || bb.size === 0) return 0;
  let shared = 0;
  for (const g of ba) if (bb.has(g)) shared++;
  return (2 * shared) / (ba.size + bb.size);
}
function similarity(input: string, productName: string): number {
  const ni = normalizeStr(input), np = normalizeStr(productName);
  if (!ni || !np) return 0;
  if (ni === np) return 1;
  // Substring match: "syringe" typed when "syringe 5ml" exists
  if (ni.length >= 4 && (np.includes(ni) || ni.includes(np))) return 0.9;
  // Bigram Dice + word overlap bonus
  const dice = diceSim(ni, np);
  const wi = new Set(ni.split(" ").filter(w => w.length > 2));
  const wp = new Set(np.split(" ").filter(w => w.length > 2));
  let wordOverlap = 0;
  for (const w of wi) if (wp.has(w)) wordOverlap++;
  const wordBonus = wi.size > 0 ? (wordOverlap / wi.size) * 0.2 : 0;
  return Math.min(1, dice + wordBonus);
}

// ── Similar-products warning panel ───────────────────────────────────────────
type Match = StockRow & { score: number };

function SimilarProductsPanel({
  matches,
  confirmed,
  onConfirm,
}: {
  matches: Match[];
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
}) {
  const hasHighSim = matches.some(m => m.score >= 0.85);

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-all ${
        hasHighSim
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          size={14}
          className={`mt-0.5 shrink-0 ${hasHighSim ? "text-red-500" : "text-amber-500"}`}
        />
        <div>
          <p className={`text-sm font-bold ${hasHighSim ? "text-red-700" : "text-amber-700"}`}>
            {hasHighSim
              ? `Near-duplicate found — ${matches.length} similar product${matches.length > 1 ? "s" : ""}`
              : `${matches.length} similar product${matches.length > 1 ? "s" : ""} found`}
          </p>
          <p className={`text-xs mt-0.5 ${hasHighSim ? "text-red-600" : "text-amber-600"}`}>
            Review before saving — duplicate product न बनाएं
          </p>
        </div>
      </div>

      {/* Match cards */}
      <div className="space-y-2">
        {matches.map(m => {
          const pct = Math.round(m.score * 100);
          const isHigh = m.score >= 0.85;
          return (
            <div
              key={m.product_id}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                isHigh
                  ? "bg-red-100/50 border-red-200"
                  : "bg-white border-amber-200/80"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 truncate">{m.product_name}</p>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isHigh
                        ? "bg-red-200 text-red-700"
                        : "bg-amber-200 text-amber-700"
                    }`}
                  >
                    {pct}% similar
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {m.product_category && <span className="mr-2">{m.product_category}</span>}
                  {m.last_updated_at
                    ? <span className={m.stock_quantity === 0 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
                        {m.stock_quantity} {m.unit_of_measure} in stock
                      </span>
                    : <span className="text-slate-400">Stock not set yet</span>
                  }
                </p>
              </div>
              <Link
                href={`/products?edit=${m.product_id}`}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5 hover:bg-teal-100 transition-colors whitespace-nowrap"
              >
                Update stock <ArrowRight size={10} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Acknowledgment checkbox — only shown for high-similarity matches */}
      {hasHighSim && (
        <div className="flex items-start gap-2.5 pt-2 border-t border-red-200/60">
          <input
            type="checkbox"
            id="confirm-new-product"
            checked={confirmed}
            onChange={e => onConfirm(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded accent-slate-600 shrink-0"
          />
          <label
            htmlFor="confirm-new-product"
            className="text-xs text-slate-700 cursor-pointer leading-relaxed select-none"
          >
            I have reviewed the list above and confirm this is a genuinely new product
            <span className="block text-slate-400 mt-0.5">
              मैंने verify किया — यह एक नया product है, duplicate नहीं
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Product form ──────────────────────────────────────────────────────────────
function ProductForm({ onSaved }: { onSaved: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  // Use plain useState instead of RHF watch() — React Compiler memoizes components
  // in production (webpack) in a way that breaks RHF's watch subscription.
  const [productName, setProductName] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Record<string, unknown>>({
    defaultValues: { unit_of_measure: "piece", sample_priority: false },
  });

  // Pull RHF's own onChange out so we can call both handlers
  const { onChange: rhfOnChange, ...nameRegisterRest } = register("product_name", { required: true });

  // Fetch existing products for similarity check
  const { data: stockData } = useQuery({
    queryKey: ["stock"],
    queryFn: getStock,
    staleTime: 60_000,
  });
  const existing = (stockData as StockRow[] | undefined) ?? [];

  // Compute similar matches (memoised — only recomputes when name or list changes)
  const matches: Match[] = useMemo(() => {
    if (productName.length < 3) return [];
    return existing
      .map(p => ({ ...p, score: similarity(productName, p.product_name) }))
      .filter(m => m.score >= 0.60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [productName, existing]);

  const hasHighSim = matches.some(m => m.score >= 0.85);
  const blocked = hasHighSim && !confirmed;

  const mut = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      const d = data as { id: string; reactivated?: boolean };
      toast.success(d.reactivated ? "Product restored and updated" : "Product saved", {
        duration: 7000,
        action: { label: "View in catalog →", onClick: () => router.push(`/products/${d.id}`) },
      });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={handleSubmit(v => {
        if (blocked) return;
        mut.mutate(cleanPayload(v as Record<string, unknown>));
      })}
      className="space-y-4"
    >
      <Field label="Product name *" hint="एक standard नाम — visits और orders में reuse होगा">
        <Input
          {...nameRegisterRest}
          placeholder="e.g. IV Cannula 20G"
          autoComplete="off"
          onChange={e => {
            rhfOnChange(e);
            setProductName(e.target.value);
            setConfirmed(false);
          }}
        />
        {errors.product_name && (
          <p className="text-xs text-red-500 mt-0.5">Product name is required</p>
        )}
      </Field>

      {/* Inline duplicate-detection panel */}
      {matches.length > 0 && (
        <SimilarProductsPanel
          matches={matches}
          confirmed={confirmed}
          onConfirm={setConfirmed}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="SKU" hint="Short code e.g. IV-SET">
          <Input {...register("sku")} placeholder="IV-20G" />
        </Field>
        <Field label="Category" hint="e.g. Infusion, Gloves">
          <Input {...register("product_category")} placeholder="Infusion" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Unit of measure" hint="piece, box, pack…">
          <Input {...register("unit_of_measure")} defaultValue="piece" />
        </Field>
        <Field label="Preferred brand" hint="e.g. Romson">
          <Input {...register("preferred_brand")} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Hindi name" hint="Field में जो नाम बोला जाता है">
          <Input {...register("hindi_name")} />
        </Field>
        <Field label="Alias" hint="Hospital का दूसरा नाम">
          <Input {...register("alias_name")} />
        </Field>
      </div>

      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          id="sp"
          {...register("sample_priority")}
          className="w-4 h-4 rounded accent-teal-600"
        />
        <label htmlFor="sp" className="text-sm font-medium text-slate-700">
          Sample priority <span className="text-slate-400 font-normal">— नमूना प्राथमिकता</span>
        </label>
      </div>

      <Field label="Notes" hint="Product से जुड़ी कोई जरूरी बात">
        <Textarea {...register("notes")} rows={3} />
      </Field>

      <div className="pt-2 pb-6">
        <Button
          type="submit"
          className={`w-full h-11 text-base transition-colors ${
            blocked
              ? "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300"
              : ""
          }`}
          disabled={mut.isPending || blocked}
        >
          {blocked
            ? "Check the box above to confirm this is a new product"
            : mut.isPending
            ? "Saving…"
            : "Save Product"}
        </Button>
        {blocked && (
          <p className="text-center text-xs text-slate-400 mt-2">
            Scroll up and tick the confirmation checkbox ↑
          </p>
        )}
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddProductPage() {
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Product</h1>
        <p className="text-slate-500 text-sm mt-0.5">उत्पाद जोड़ें · Surgical or medical item</p>
      </div>
      <ProductForm key={formKey} onSaved={() => setFormKey(k => k + 1)} />
    </div>
  );
}

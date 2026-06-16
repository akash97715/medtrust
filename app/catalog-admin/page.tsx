"use client";
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCatalogProducts, createCatalogProduct, deleteCatalogProduct } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus, Trash2, ImagePlus, X, ArrowLeft, Sparkles, GripVertical,
  CheckCircle2, Loader2, Package, CloudUpload, AlertCircle,
} from "lucide-react";

// ── Cloudinary config ──────────────────────────────────────────────────────
const CLOUD_NAME = "dbcjgit4n";
const UPLOAD_PRESET = "medtrust_catalog";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

type SpecRow = { key: string; value: string };
type CatalogProduct = {
  id: string; name: string; description: string; category?: string;
  brand?: string; image_count: number; primary_image?: string;
};

// ── Upload directly to Cloudinary ─────────────────────────────────────────
async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "medtrust_catalog");

  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Cloudinary upload failed");
  }
  const data = await res.json();
  // Return optimised URL with auto format + quality
  return data.secure_url.replace("/upload/", "/upload/f_auto,q_auto,w_1400/");
}

// ── Slot state ─────────────────────────────────────────────────────────────
type SlotState = {
  localPreview: string | null;   // object URL for instant preview
  cloudUrl: string | null;       // final Cloudinary URL
  uploading: boolean;
  error: boolean;
};

function makeSlots(count: number): SlotState[] {
  return Array(count).fill(null).map(() => ({
    localPreview: null, cloudUrl: null, uploading: false, error: false,
  }));
}

// ── Single image slot ──────────────────────────────────────────────────────
function ImageSlot({
  index, slot, onChange, onRemove,
}: {
  index: number;
  slot: SlotState;
  onChange: (idx: number, patch: Partial<SlotState>) => void;
  onRemove: (idx: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    // Show preview immediately
    const preview = URL.createObjectURL(file);
    onChange(index, { localPreview: preview, cloudUrl: null, uploading: true, error: false });
    try {
      const url = await uploadToCloudinary(file);
      onChange(index, { cloudUrl: url, uploading: false });
    } catch (e) {
      console.error(e);
      onChange(index, { uploading: false, error: true });
      toast.error(`Image ${index + 1}: upload failed — check console`);
    }
  }, [index, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const { localPreview, uploading, error, cloudUrl } = slot;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
        error
          ? "border-red-300 bg-red-50"
          : uploading
          ? "border-teal-300 bg-teal-50"
          : localPreview
          ? "border-transparent shadow-md"
          : "border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/30"
      }`}
      onClick={() => !localPreview && ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {localPreview ? (
        <>
          {/* Preview image */}
          <img src={localPreview} alt="" className="w-full h-full object-cover" />

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
              <Loader2 size={20} className="text-white animate-spin" />
              <span className="text-white text-[9px] font-semibold">Uploading…</span>
            </div>
          )}

          {/* Success checkmark */}
          {!uploading && cloudUrl && (
            <div className="absolute top-1.5 left-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-1">
              <AlertCircle size={18} className="text-red-200" />
              <span className="text-red-200 text-[9px] font-semibold">Failed</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
                className="text-[9px] text-white underline mt-0.5"
              >
                Retry
              </button>
            </div>
          )}

          {/* Image label */}
          <div className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
            {index === 0 ? "Main" : `#${index + 1}`}
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X size={10} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-slate-300 group-hover:text-teal-400 transition-colors p-2">
          <ImagePlus size={20} />
          <span className="text-[9px] font-medium text-center leading-tight">
            {index === 0 ? "Main image" : `Image ${index + 1}`}
          </span>
          <span className="text-[8px] text-slate-200 group-hover:text-teal-300">click or drag</span>
        </div>
      )}
    </div>
  );
}

// ── Add Product Form ───────────────────────────────────────────────────────
function AddProductForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<"count" | "form">("count");
  const [imageCount, setImageCount] = useState(4);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: "", value: "" }]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(2);

  const createMut = useMutation({
    mutationFn: createCatalogProduct,
    onSuccess: () => {
      toast.success("Product published to catalog!");
      qc.invalidateQueries({ queryKey: ["catalog-products"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCountConfirm = () => {
    setSlots(makeSlots(imageCount));
    setStep("form");
  };

  const updateSlot = useCallback((idx: number, patch: Partial<SlotState>) => {
    setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }, []);

  const removeSlot = useCallback((idx: number) => {
    setSlots((prev) => prev.map((s, i) => i === idx ? makeSlots(1)[0] : s));
  }, []);

  const addSpec = () => setSpecs((s) => [...s, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i));
  const setSpec = (i: number, f: "key" | "value", v: string) =>
    setSpecs((s) => s.map((r, idx) => idx === i ? { ...r, [f]: v } : r));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Product name is required"); return; }
    if (!description.trim()) { toast.error("Description is required"); return; }

    const stillUploading = slots.some((s) => s.uploading);
    if (stillUploading) { toast.error("Please wait — images are still uploading"); return; }

    const hasError = slots.some((s) => s.error);
    if (hasError) { toast.error("Some images failed to upload. Please retry them."); return; }

    const images = slots.map((s) => s.cloudUrl).filter(Boolean) as string[];

    createMut.mutate({
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
      brand: brand.trim() || undefined,
      unit: unit.trim() || undefined,
      delivery_days: deliveryDays,
      images,
      specs: specs.filter((s) => s.key.trim() && s.value.trim()),
    });
  };

  // ── Step 1: pick image count ─────────────────────────────────────────────
  if (step === "count") {
    return (
      <div className="max-w-sm mx-auto text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <CloudUpload size={26} className="text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">How many images?</h2>
        <p className="text-sm text-slate-400 mb-2">Choose number of product images to upload</p>
        <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-block mb-8 font-medium">
          ✓ Images upload directly to Cloudinary CDN
        </p>

        <div className="grid grid-cols-5 gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setImageCount(n)}
              className={`aspect-square rounded-xl text-lg font-bold transition-all ${
                imageCount === n
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30 scale-110"
                  : "bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onDone}
            className="flex-1 h-11 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleCountConfirm}
            className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors">
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: full form ────────────────────────────────────────────────────
  const uploadedCount = slots.filter((s) => s.cloudUrl).length;
  const uploadingCount = slots.filter((s) => s.uploading).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setStep("count")} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Add New Product</h2>
          <p className="text-xs text-slate-400">Published instantly once saved</p>
        </div>
      </div>

      {/* Image upload grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Product Images
            </label>
            <span className="ml-2 text-xs text-slate-400">
              {uploadingCount > 0
                ? `Uploading ${uploadingCount}…`
                : uploadedCount > 0
                ? `${uploadedCount}/${slots.length} uploaded to Cloudinary`
                : `${slots.length} slots · drag or click each`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Sparkles size={12} className="text-purple-300" />
            AI gen — coming soon
          </div>
        </div>

        <div className={`grid gap-3 ${
          slots.length <= 3 ? "grid-cols-3" :
          slots.length <= 6 ? "grid-cols-3 sm:grid-cols-6" :
          "grid-cols-4 sm:grid-cols-5"
        }`}>
          {slots.map((slot, i) => (
            <ImageSlot key={i} index={i} slot={slot} onChange={updateSlot} onRemove={removeSlot} />
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          First image appears on listing cards · Images are stored on Cloudinary CDN
        </p>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Disposable Surgical Gloves — Sterile, Latex-free"
            className="w-full border border-slate-200 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the product — its use, material, certifications, who it's for…"
            className="w-full border border-slate-200 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Surgical Consumables"
            className="w-full border border-slate-200 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Brand / Make</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Unison Medical"
            className="w-full border border-slate-200 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Unit of Measure</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. Box of 100, Piece, Pack"
            className="w-full border border-slate-200 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Delivery Days</label>
          <div className="flex items-center gap-2 flex-wrap">
            {[1, 2, 3, 5, 7].map((d) => (
              <button key={d} type="button" onClick={() => setDeliveryDays(d)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                  deliveryDays === d ? "bg-teal-600 text-white shadow" : "bg-slate-100 text-slate-500 hover:bg-teal-50"
                }`}>
                {d}
              </button>
            ))}
            <span className="text-xs text-slate-400">days from order</span>
          </div>
        </div>
      </div>

      {/* Key-value specs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">
            Product Specifications
            <span className="ml-2 text-xs font-normal text-slate-400">shown as a table on the product page</span>
          </label>
          <button type="button" onClick={addSpec}
            className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium">
            <Plus size={13} /> Add row
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical size={14} className="text-slate-200 flex-shrink-0" />
              <input value={s.key} onChange={(e) => setSpec(i, "key", e.target.value)}
                placeholder="Key  (e.g. Material)"
                className="flex-1 border border-slate-200 focus:border-teal-400 rounded-lg px-3 py-2 text-sm outline-none transition-colors" />
              <input value={s.value} onChange={(e) => setSpec(i, "value", e.target.value)}
                placeholder="Value  (e.g. Latex-free nitrile)"
                className="flex-1 border border-slate-200 focus:border-teal-400 rounded-lg px-3 py-2 text-sm outline-none transition-colors" />
              <button type="button" onClick={() => removeSpec(i)}
                className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2 pb-8">
        <button type="submit" disabled={createMut.isPending || uploadingCount > 0}
          className="flex items-center gap-2 h-12 px-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors">
          {createMut.isPending
            ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
            : uploadingCount > 0
            ? <><Loader2 size={16} className="animate-spin" /> Uploading {uploadingCount} image{uploadingCount !== 1 ? "s" : ""}…</>
            : <><CheckCircle2 size={16} /> Publish to Catalog</>}
        </button>
        <button type="button" onClick={onDone}
          className="h-12 px-6 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function CatalogAdminPage() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-products"],
    queryFn: getCatalogProducts,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const deleteMut = useMutation({
    mutationFn: deleteCatalogProduct,
    onSuccess: () => {
      toast.success("Product removed from catalog");
      qc.invalidateQueries({ queryKey: ["catalog-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const products = (data as CatalogProduct[] ?? []);

  if (adding) {
    return <div className="max-w-3xl"><AddProductForm onDone={() => setAdding(false)} /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/catalog" className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 mb-1 transition-colors">
            <ArrowLeft size={11} /> Back to Catalog
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Manage Product Catalog</h1>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""} published · Images on Cloudinary CDN</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <Package size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 font-medium mb-1">No products yet</p>
          <p className="text-slate-300 text-sm mb-4">Add your first product and it appears in the catalog immediately</p>
          <button onClick={() => setAdding(true)} className="text-sm text-teal-600 font-semibold hover:underline">
            Add Product →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {p.primary_image
                  ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={20} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                  {p.category && <span>{p.category}</span>}
                  <span>{p.image_count} image{p.image_count !== 1 ? "s" : ""} on Cloudinary</span>
                  <span className="text-emerald-600 font-medium">● Live</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/catalog/${p.id}`}
                  className="text-xs border border-slate-200 hover:border-teal-300 text-slate-500 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-colors">
                  Preview
                </Link>
                <button
                  onClick={() => { if (confirm(`Remove "${p.name}"?`)) deleteMut.mutate(p.id); }}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1.5">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

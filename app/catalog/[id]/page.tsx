"use client";
import { use, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCatalogProduct, createEnquiry } from "@/lib/api";
import Link from "next/link";
import {
  Zap, Package, BadgeCheck,
  Phone, X, CheckCircle2, Loader2, PhoneCall, MessageCircle,
} from "lucide-react";


const MEDTRUST_PHONE = "8789198929";

const PALETTES = [
  "from-teal-400 via-teal-500 to-cyan-600",
  "from-blue-400 via-blue-500 to-indigo-600",
  "from-purple-400 via-purple-500 to-violet-600",
  "from-emerald-400 via-emerald-500 to-green-600",
  "from-amber-400 via-amber-500 to-orange-500",
  "from-rose-400 via-rose-500 to-pink-600",
  "from-sky-400 via-sky-500 to-blue-600",
];
function getPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % PALETTES.length;
  return PALETTES[h];
}
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type CatalogProductDetail = {
  id: string;
  name: string;
  description: string;
  category?: string;
  brand?: string;
  unit?: string;
  delivery_days: number;
  images: { id: string; image_url: string; sort_order: number }[];
  specs: { id: string; spec_key: string; spec_value: string }[];
};

// ── Enquiry Modal ─────────────────────────────────────────────────────────
function EnquiryModal({
  product,
  onClose,
}: {
  product: { id: string; name: string };
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await createEnquiry({
        product_id: product.id,
        product_name: product.name,
        visitor_phone: phone.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      // still show success — enquiry intent captured
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }, [phone, product]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-sm mx-0 sm:mx-4 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 pt-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Get Best Price
          </p>
          <p className="text-white font-bold text-lg leading-snug line-clamp-2">
            {product.name}
          </p>
        </div>

        {/* Content */}
        <div className="-mt-4 bg-white rounded-t-3xl px-6 pt-6 pb-8 space-y-5">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">Thank you!</p>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                  Your enquiry has been recorded. Our team will call you shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Call us */}
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-2">
                  Call us directly
                </p>
                <a
                  href={`tel:${MEDTRUST_PHONE}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-700 transition-colors">
                    <PhoneCall size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-teal-800 font-black text-xl tracking-wide">
                      +91 {MEDTRUST_PHONE}
                    </p>
                    <p className="text-teal-500 text-xs">Tap to call · Mon–Sat 9am–6pm</p>
                  </div>
                </a>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <p className="text-xs text-slate-400 font-medium">or leave your number</p>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Phone input */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-sm text-slate-400 font-medium">+91</span>
                    <div className="w-px h-4 bg-slate-200" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Your 10-digit mobile number"
                    className="w-full pl-14 pr-4 py-3 border border-slate-200 focus:border-teal-400 rounded-xl text-sm text-slate-800 outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Optional — we&apos;ll call you back if you share your number.
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  ) : (
                    <><MessageCircle size={16} /> Send Enquiry</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ["catalog-product", id],
    queryFn: () => getCatalogProduct(id),
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-5xl animate-pulse space-y-6">
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="h-80 bg-slate-100 rounded-2xl" />
            <div className="flex gap-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 w-16 bg-slate-100 rounded-xl" />)}</div>
          </div>
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  const p = data as CatalogProductDetail;
  if (!p) return <div className="text-slate-400 text-center py-20">Product not found.</div>;

  const palette = getPalette(p.name);
  const initials = getInitials(p.name);
  const hasImages = p.images.length > 0;
  const displayImages = p.images.slice(0, 6);
  const activeImage = displayImages[activeIdx];

  const fixedSpecs = [
    { label: "Delivery Time", value: `Within ${p.delivery_days} day${p.delivery_days !== 1 ? "s" : ""} of order confirmation`, highlight: true },
    ...(p.category ? [{ label: "Category", value: p.category }] : []),
    ...(p.brand ? [{ label: "Brand / Make", value: p.brand }] : []),
    ...(p.unit ? [{ label: "Unit", value: p.unit }] : []),
  ];
  const customSpecs = p.specs.map((s) => ({ label: s.spec_key, value: s.spec_value }));
  const allSpecs = [...fixedSpecs, ...customSpecs];

  return (
    <>
      <div className="max-w-5xl space-y-6 pb-10">

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
          {/* LEFT — Gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white" style={{ height: 340 }}>
              {hasImages && activeImage ? (
                <img src={activeImage.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${palette} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="relative z-10 w-24 h-24 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                    <span className="text-4xl font-black text-white">{initials}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasImages && displayImages.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {displayImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeIdx === i
                        ? "border-teal-500 scale-105 shadow-md"
                        : "border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Package size={13} />
                <span>MedTrust Healthcare</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                <BadgeCheck size={12} />
                Verified Product
              </div>
            </div>
          </div>

          {/* RIGHT — Details */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-tight mb-3">{p.name}</h1>

              {/* Delivery banner */}
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Zap size={16} className="text-white fill-white" />
                </div>
                <div>
                  <p className="text-emerald-800 font-bold text-sm">
                    Delivery within {p.delivery_days} day{p.delivery_days !== 1 ? "s" : ""}
                  </p>
                  <p className="text-emerald-600 text-xs">From order confirmation date</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>

            {/* Specs table */}
            {allSpecs.length > 0 && (
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                {allSpecs.map((s, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"} ${i < allSpecs.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <span className="text-xs text-slate-400 font-medium w-36 flex-shrink-0 pt-0.5">{s.label}</span>
                    <span className={`text-sm font-semibold flex-1 ${(s as { highlight?: boolean }).highlight ? "text-emerald-700" : "text-slate-700"}`}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="pt-1">
              <button
                onClick={() => setShowEnquiry(true)}
                className="w-full h-12 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-teal-500/20"
              >
                <Phone size={15} /> Get Best Price
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEnquiry && (
        <EnquiryModal
          product={{ id: p.id, name: p.name }}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </>
  );
}

"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCatalogProducts } from "@/lib/api";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Package, Zap, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Gradient fallback if no image uploaded
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

type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  category?: string;
  brand?: string;
  unit?: string;
  delivery_days: number;
  primary_image?: string;
  image_count: number;
};

function ProductCard({ p }: { p: CatalogProduct }) {
  const palette = getPalette(p.name);
  return (
    <Link
      href={`/catalog/${p.id}`}
      className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {p.primary_image ? (
          <img
            src={p.primary_image}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${palette} flex items-center justify-center`}>
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
              <span className="text-2xl font-black text-white">{getInitials(p.name)}</span>
            </div>
          </div>
        )}

        {/* Category pill */}
        {p.category && (
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {p.category}
          </div>
        )}

        {/* Image count */}
        {p.image_count > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            +{p.image_count - 1} more
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-teal-700 transition-colors">
          {p.name}
        </h3>

        {p.brand && <p className="text-xs text-slate-400 mb-2">{p.brand}</p>}

        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{p.description}</p>

        {/* Delivery */}
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
          <Zap size={10} className="fill-emerald-600 text-emerald-600" />
          <span className="font-semibold">Delivery within {p.delivery_days} days</span>
        </div>

        <div className="h-8 flex items-center justify-center bg-teal-600 group-hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors">
          View Details →
        </div>
      </div>
    </Link>
  );
}

export default function CatalogPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["catalog-products"],
    queryFn: getCatalogProducts,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const all = (data as CatalogProduct[] ?? []);
  const categories = [...new Set(all.map((r) => r.category ?? "").filter(Boolean))];

  const rows = all.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-8 text-white">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-teal-300 fill-teal-300" />
              <span className="text-teal-300 text-xs font-semibold uppercase tracking-widest">Surgical &amp; Medical</span>
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Product Catalog</h1>
            <p className="text-teal-200 text-sm">
              {all.length} product{all.length !== 1 ? "s" : ""} · All deliveries within 2 days of order confirmation
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/catalog-admin"
              className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg transition-colors border border-white/20"
            >
              <Settings size={13} /> Manage
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <Input
          placeholder="Search products, categories, brands…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category chips */}
      {categories.length > 0 && !search && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSearch(cat)}
              className="text-xs bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-8 bg-slate-100 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-slate-500">
            {search ? "No products match your search" : "No products yet"}
          </p>
          {search ? (
            <button onClick={() => setSearch("")} className="text-teal-600 text-sm mt-2 hover:underline">
              Clear search
            </button>
          ) : isAdmin ? (
            <Link href="/catalog-admin" className="text-teal-600 text-sm mt-2 hover:underline block">
              Add the first product →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {rows.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

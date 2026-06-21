"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  "": "Home",
  dashboard: "Dashboard",
  parties: "Parties",
  products: "Products",
  visits: "Visits",
  orders: "Orders",
  pricing: "Pricing",
  admin: "Add Data",
  company: "Company",
  catalog: "Catalog",
  "catalog-admin": "Manage Catalog",
  invoices: "Orders",
};

const SUB_LABELS: Record<string, string> = {
  party: "Add Party",
  product: "Add Product",
  visit: "Log Visit",
  order: "Add Order",
  edit: "Edit",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] ?? "";
  const sectionLabel = SECTION_LABELS[section] ?? "Back";
  const isSubPage = segments.length >= 2;

  const lastSeg = segments[segments.length - 1];
  const subLabel = SUB_LABELS[lastSeg] ?? "Details";

  return (
    <header className="sticky top-0 z-20 bg-[#0c1220] border-b border-white/5 h-14 flex items-center px-4 md:px-8 shrink-0 gap-3">

      {/* MedTrust home button — mobile only (sidebar shows it on desktop) */}
      <Link
        href="/"
        title="Go to home"
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-400 shadow-sm shadow-teal-500/40 transition-all active:scale-95 shrink-0"
      >
        <span className="text-white font-black text-sm">M</span>
      </Link>

      {/* Divider — mobile only */}
      <span className="md:hidden text-white/10 select-none">|</span>

      {isSubPage ? (
        <>
          {/* Back button — prominent pill, always shows parent label */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white bg-white/[0.07] hover:bg-white/[0.13] border border-white/[0.12] px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={15} />
            {sectionLabel}
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white/60 font-medium text-sm truncate">{subLabel}</span>
        </>
      ) : (
        <span className="font-semibold text-white/70 text-sm">{sectionLabel}</span>
      )}
    </header>
  );
}

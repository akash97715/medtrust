"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  "": "Dashboard",
  dashboard: "Dashboard",
  parties: "Parties",
  products: "Products",
  visits: "Visits",
  orders: "Orders",
  pricing: "Pricing",
  admin: "Add Data",
  company: "Company",
};

const ADMIN_SUB_LABELS: Record<string, string> = {
  party: "Add Party",
  product: "Add Product",
  visit: "Log Visit",
  order: "Add Order",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] ?? "";
  const sectionLabel = SECTION_LABELS[section] ?? "MedTrust";
  const isSubPage = segments.length >= 2;
  const parentHref = section ? `/${section}` : "/";

  const lastSeg = segments[segments.length - 1];
  const subLabel =
    section === "admin" && ADMIN_SUB_LABELS[lastSeg]
      ? ADMIN_SUB_LABELS[lastSeg]
      : lastSeg === "edit"
      ? "Edit"
      : "Details";

  return (
    <header className="sticky top-0 z-20 bg-[#0c1220] border-b border-white/5 h-16 flex items-center px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile logo */}
        <Link href="/" className="md:hidden flex items-center gap-2 mr-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500 shadow-sm shadow-teal-500/30 shrink-0">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <div>
            <p className="font-bold text-[14px] text-white tracking-tight leading-none">MedTrust</p>
            <p className="text-[8px] text-white/30 font-semibold tracking-[0.06em] mt-0.5">Reliable · Rapid · Cost-Optimal</p>
          </div>
        </Link>

        {/* Back button — prominent on mobile */}
        {isSubPage && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/8 -ml-1"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">
              {SECTION_LABELS[section] ?? "Back"}
            </span>
          </button>
        )}

        {/* Breadcrumb / title */}
        <div className="flex items-center gap-2 min-w-0">
          {isSubPage ? (
            <>
              <span className="hidden sm:inline text-white/20">/</span>
              <span className="text-white/80 font-semibold text-sm truncate">{subLabel}</span>
            </>
          ) : (
            <span className="hidden md:block font-semibold text-white/80 text-sm">{sectionLabel}</span>
          )}
        </div>
      </div>

      {/* Right: breadcrumb path on desktop */}
      {isSubPage && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-white/30">
          <Link href={parentHref} className="hover:text-teal-400 transition-colors font-medium">
            {SECTION_LABELS[section]}
          </Link>
          <span>/</span>
          <span className="text-white/60 font-medium">{subLabel}</span>
        </div>
      )}
    </header>
  );
}

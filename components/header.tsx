"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  "": "Dashboard",
  parties: "Parties",
  products: "Products",
  visits: "Visits",
  orders: "Orders",
  pricing: "Pricing",
  admin: "Add Data",
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
    <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-16 flex items-center px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile logo */}
        <Link href="/" className="md:hidden flex items-center gap-2.5 mr-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500 shadow-sm shadow-teal-500/30">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <span className="font-bold text-[15px] text-slate-900 tracking-tight">MedTrust</span>
        </Link>

        {/* Back button — prominent on mobile */}
        {isSubPage && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 -ml-1"
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
              <span className="hidden sm:inline text-slate-300">/</span>
              <span className="text-slate-800 font-semibold text-sm truncate">{subLabel}</span>
            </>
          ) : (
            <span className="hidden md:block font-semibold text-slate-800 text-sm">{sectionLabel}</span>
          )}
        </div>
      </div>

      {/* Right: breadcrumb path on desktop */}
      {isSubPage && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <Link href={parentHref} className="hover:text-teal-600 transition-colors font-medium">
            {SECTION_LABELS[section]}
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{subLabel}</span>
        </div>
      )}
    </header>
  );
}

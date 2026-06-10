"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, HeartPulse } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  "": "Dashboard",
  parties: "Parties",
  products: "Products",
  visits: "Visits",
  orders: "Orders",
  pricing: "Pricing",
  admin: "Add Data",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] ?? "";
  const sectionLabel = SECTION_LABELS[section] ?? "MedTrust";
  const isSubPage = segments.length >= 2;
  const parentHref = section ? `/${section}` : "/";
  const subLabel = segments[segments.length - 1] === "edit" ? "Edit" : "Details";

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 h-14 flex items-center px-4 md:px-8 gap-3 shrink-0">
      {isSubPage && (
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={17} />
        </button>
      )}

      <div className="md:hidden flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-teal-500/15">
          <HeartPulse size={14} className="text-teal-600" />
        </div>
        <span className="font-semibold text-sm text-slate-800">MedTrust</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm">
        {isSubPage ? (
          <>
            <Link href={parentHref} className="text-slate-400 hover:text-teal-600 transition-colors font-medium">
              {SECTION_LABELS[section]}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">{subLabel}</span>
          </>
        ) : (
          <span className="font-semibold text-slate-800">{sectionLabel}</span>
        )}
      </div>
    </header>
  );
}

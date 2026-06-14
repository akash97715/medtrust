"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";
import {
  LayoutDashboard, Users, Package, CalendarCheck, ShoppingCart,
  DollarSign, PlusCircle, MoreHorizontal, X, Building2, Lock, Store,
  UserCheck, ChevronRight,
} from "lucide-react";

// Admin-only pages (require owner code)
const ADMIN_HREFS = new Set(["/dashboard", "/parties", "/products", "/orders", "/pricing", "/catalog-admin"]);

function LockModal({ targetHref, onClose }: { targetHref: string; onClose: () => void }) {
  const { tryUnlock, isAdmin } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const needsAdmin = ADMIN_HREFS.has(targetHref);

  const handleComplete = async (pin: string) => {
    setLoading(true);
    setError(false);
    const ok = await tryUnlock(pin);
    setLoading(false);
    if (ok) {
      // Only navigate if the role now satisfies the requirement
      const { isAdmin: nowAdmin, isStaff: nowStaff } = { isAdmin: ok && true, isStaff: ok && true };
      // tryUnlock updates context; just close and push
      onClose();
      router.push(targetHref);
    } else {
      setError(true);
      setResetPin((v) => v + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xs mx-4 bg-[#0d1526] border border-white/12 rounded-2xl shadow-2xl shadow-black/70 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
          <X size={15} />
        </button>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 mb-4">
          <Lock size={18} className="text-teal-400" />
        </div>
        <h2 className="text-white font-semibold text-[15px] mb-1">
          {needsAdmin ? "Admin Access" : "Staff Access"}
        </h2>
        <p className="text-white/50 text-xs mb-5 leading-relaxed">
          Enter your{" "}
          <span className="text-white/75 font-semibold">{needsAdmin ? "admin" : "staff"} code</span>{" "}
          to unlock <span className="text-white/75 font-semibold capitalize">{targetHref.slice(1)}</span>.
        </p>
        <PinInput dark onComplete={handleComplete} loading={loading} reset={resetPin} />
        {loading && <p className="text-white/40 text-xs mt-3 text-center">Verifying…</p>}
        {error && <p className="text-red-400 text-xs mt-3 text-center font-medium">Incorrect code. Try again.</p>}
        <button onClick={onClose} className="w-full mt-4 text-sm text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, label, icon: Icon, onClick }: {
  href?: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href ? pathname.startsWith(href + "/") : false);

  const cls = cn(
    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 w-full text-left",
    active ? "bg-white/[0.1] text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={cls}>
        {active && <span className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />}
        <Icon size={15} className={cn("shrink-0", active ? "text-teal-400" : "")} />
        {label}
      </button>
    );
  }

  return (
    <Link href={href!} className={cls}>
      {active && <span className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />}
      <Icon size={15} className={cn("shrink-0", active ? "text-teal-400" : "")} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isStaff, isAdmin } = useAuth();
  const [lockModal, setLockModal] = useState<string | null>(null);

  const isCatalog = pathname === "/catalog" || pathname.startsWith("/catalog/");

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen fixed top-0 left-0 z-30 bg-[#0b1120] border-r border-white/[0.06]">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] shrink-0 hover:bg-white/[0.03] transition-colors">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/40 shrink-0">
          <span className="text-white font-black text-sm">M</span>
        </div>
        <div>
          <p className="font-bold text-white text-[15px] tracking-tight leading-none">MedTrust</p>
          <p className="text-[10px] text-teal-400/60 mt-0.5 font-semibold tracking-[0.18em]">HEALTHCARE</p>
        </div>
      </Link>

      <nav className="flex flex-col px-3 pt-4 flex-1 gap-px overflow-y-auto">

        {/* ── Public section ── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 px-3 pb-2 pt-1">
          Catalog
        </p>

        {/* Product Catalog */}
        <Link
          href="/catalog"
          className={cn(
            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150",
            isCatalog
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
              : "text-amber-300 border border-amber-400/25 bg-amber-400/[0.07] hover:bg-amber-400/[0.12] hover:border-amber-400/40 hover:text-amber-200"
          )}
        >
          <Store size={15} className="shrink-0" />
          <span className="flex-1">Product Catalog</span>
          {!isCatalog && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
          )}
        </Link>

        <Link
          href="/company"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150",
            pathname.startsWith("/company") ? "bg-white/[0.1] text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
          )}
        >
          <Building2 size={15} className={cn("shrink-0", pathname.startsWith("/company") ? "text-teal-400" : "")} />
          Company
        </Link>

        {/* ── Staff section ── */}
        {isStaff && (
          <>
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 px-3 pb-2">
                Staff
              </p>
              <div className="space-y-px">
                <NavLink href="/parties" label="Parties" icon={Users} />
                <NavLink href="/visits" label="Visits" icon={CalendarCheck} />
                <NavLink href="/visitors" label="Visitors" icon={UserCheck} />
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150",
                    pathname.startsWith("/admin")
                      ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                      : "bg-teal-500/[0.1] text-teal-300 border border-teal-500/20 hover:bg-teal-500/[0.18] hover:text-teal-200 hover:border-teal-500/35"
                  )}
                >
                  <PlusCircle size={15} className="shrink-0" />
                  Add Data
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── Admin section ── */}
        {isAdmin && (
          <>
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 px-3 pb-2">
                Operations
              </p>
              <div className="space-y-px">
                <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
                <NavLink href="/products" label="Products" icon={Package} />
                <NavLink href="/orders" label="Orders" icon={ShoppingCart} />
                <NavLink href="/pricing" label="Pricing" icon={DollarSign} />
              </div>
            </div>

            {/* Catalog admin sub-link */}
            <div className="mt-1">
              <Link
                href="/catalog-admin"
                className={cn(
                  "flex items-center gap-3 pl-9 pr-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150",
                  pathname.startsWith("/catalog-admin")
                    ? "text-amber-300 bg-amber-500/10"
                    : "text-white/50 hover:text-amber-300 hover:bg-amber-500/[0.08]"
                )}
              >
                <ChevronRight size={12} className="shrink-0" />
                Manage Catalog
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[11px] text-white/50 font-semibold">MedTrust Healthcare</p>
        <p className="text-[10px] text-white/25 mt-0.5 font-medium">Operations v2.0</p>

        {/* Role badge + unlock button */}
        <div className="mt-2.5">
          {!isStaff && (
            <button
              onClick={() => setLockModal("/visits")}
              className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/55 transition-colors font-medium"
            >
              <Lock size={9} /> Staff access
            </button>
          )}
          {isStaff && !isAdmin && (
            <button
              onClick={() => setLockModal("/dashboard")}
              className="flex items-center gap-1.5 text-[10px] text-teal-400/50 hover:text-teal-400 transition-colors font-medium"
            >
              <Lock size={9} /> Admin access
            </button>
          )}
          {isAdmin && (
            <p className="text-[10px] text-teal-400/60 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
              Admin mode
            </p>
          )}
        </div>
      </div>

      {lockModal && <LockModal targetHref={lockModal} onClose={() => setLockModal(null)} />}
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { isStaff, isAdmin } = useAuth();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [lockModal, setLockModal] = useState<string | null>(null);

  const primaryLinks = [
    { href: "/catalog", label: "Catalog", icon: Store },
    ...(isStaff ? [
      { href: "/parties", label: "Parties", icon: Users },
      { href: "/visits", label: "Visits", icon: CalendarCheck },
    ] : []),
    { href: "/company", label: "Company", icon: Building2 },
  ];

  const moreLinks = [
    ...(isStaff ? [
      { href: "/visitors", label: "Visitors", icon: UserCheck },
      { href: "/admin", label: "Add Data", icon: PlusCircle },
    ] : []),
    ...(isAdmin ? [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/products", label: "Products", icon: Package },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/pricing", label: "Pricing", icon: DollarSign },
      { href: "/catalog-admin", label: "Manage Catalog", icon: Store },
    ] : []),
  ];

  const allMoreActive = moreLinks.some(({ href }) => pathname === href || pathname.startsWith(href));

  const handleMoreLinkClick = (href: string) => {
    setShowMore(false);
    router.push(href);
  };

  return (
    <>
      {showMore && moreLinks.length > 0 && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 left-3 right-3 bg-[#0b1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {moreLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <button
                  key={href}
                  onClick={() => handleMoreLinkClick(href)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 text-sm font-semibold border-b border-white/[0.06] last:border-0 transition-colors w-full text-left",
                    active ? "text-teal-300 bg-white/[0.05]" : "text-white/65 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b1120] border-t border-white/[0.07] flex justify-around px-2 py-2">
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all",
                active ? "text-teal-400 bg-white/[0.05]" : "text-white/60 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {/* Staff/Admin unlock or More */}
        {!isStaff ? (
          <button
            onClick={() => setLockModal("/visits")}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-white/25 hover:text-white/55 transition-all"
          >
            <Lock size={18} />
            Staff
          </button>
        ) : moreLinks.length > 0 ? (
          <button
            onClick={() => setShowMore((v) => !v)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all",
              showMore || allMoreActive ? "text-teal-400 bg-white/[0.05]" : "text-white/60 hover:text-white"
            )}
          >
            {showMore ? <X size={18} /> : <MoreHorizontal size={18} />}
            More
          </button>
        ) : null}
      </nav>

      {lockModal && <LockModal targetHref={lockModal} onClose={() => setLockModal(null)} />}
    </>
  );
}

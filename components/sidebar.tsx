"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";
import {
  LayoutDashboard, Users, Package, CalendarCheck, ShoppingCart,
  DollarSign, PlusCircle, MoreHorizontal, X, Building2, Lock, Store, UserCheck,
} from "lucide-react";

const LOCKED_HREFS = new Set(["/dashboard", "/products", "/orders", "/pricing", "/visitors"]);

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/visitors", label: "Visitors", icon: UserCheck },
];

function LockModal({ targetHref, onClose }: { targetHref: string; onClose: () => void }) {
  const { tryUnlock } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const handleComplete = async (pin: string) => {
    setLoading(true);
    setError(false);
    const ok = await tryUnlock(pin);
    setLoading(false);
    if (ok) {
      onClose();
      router.push(targetHref);
    } else {
      setError(true);
      setResetPin((v) => v + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xs mx-4 bg-[#0c1220] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
        >
          <X size={15} />
        </button>

        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 mb-4">
          <Lock size={18} className="text-teal-400" />
        </div>

        <h2 className="text-white font-semibold text-[15px] mb-1">Access Restricted</h2>
        <p className="text-white/40 text-xs mb-5 leading-relaxed">
          Enter your 5-digit employee code to unlock{" "}
          <span className="text-white/60 font-medium capitalize">{targetHref.slice(1)}</span>{" "}
          and all restricted sections for this session.
        </p>

        <PinInput dark onComplete={handleComplete} loading={loading} reset={resetPin} />

        {loading && <p className="text-white/40 text-xs mt-3 text-center">Verifying…</p>}
        {error && <p className="text-red-400 text-xs mt-3 text-center font-medium">Incorrect code. Please try again.</p>}

        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isUnlocked } = useAuth();
  const [lockModal, setLockModal] = useState<string | null>(null);

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen fixed top-0 left-0 z-30 bg-[#0c1220]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0 hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/30">
          <span className="text-white font-black text-sm tracking-tight">M</span>
        </div>
        <div>
          <p className="font-bold text-white text-[15px] tracking-tight leading-none">MedTrust</p>
          <p className="text-[11px] text-white/30 mt-0.5 font-medium tracking-wide">HEALTHCARE</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col px-3 pt-5 flex-1 gap-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 px-3 pb-2">
          Operations
        </p>
        {mainLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const locked = LOCKED_HREFS.has(href) && !isUnlocked;

          if (locked) {
            return (
              <button
                key={href}
                onClick={() => setLockModal(href)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full text-left",
                  active
                    ? "bg-white/8 text-white/50"
                    : "text-white/25 hover:bg-white/5 hover:text-white/40"
                )}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                <Lock size={10} className="text-white/20" />
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-white/8 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-teal-400" />
              )}
              <Icon size={15} className={active ? "text-teal-400" : ""} />
              {label}
            </Link>
          );
        })}

        {/* Product Catalog — always highlighted CTA */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
          <Link
            href="/catalog"
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150",
              pathname === "/catalog" || pathname.startsWith("/catalog/")
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 hover:text-amber-300"
            )}
          >
            <Store size={15} />
            <span className="flex-1">Product Catalog</span>
            {!(pathname === "/catalog" || pathname.startsWith("/catalog/")) && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
            )}
          </Link>
          {/* Catalog admin — only visible when unlocked */}
          {isUnlocked && (
            <Link
              href="/catalog-admin"
              className={cn(
                "flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150",
                pathname.startsWith("/catalog-admin")
                  ? "text-amber-300 bg-amber-500/10"
                  : "text-white/25 hover:text-amber-300 hover:bg-amber-500/8"
              )}
            >
              Manage Catalog
            </Link>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-white/5 space-y-0.5">
          <Link
            href="/company"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
              pathname.startsWith("/company")
                ? "bg-white/8 text-white"
                : "text-white/40 hover:bg-white/5 hover:text-white/70"
            )}
          >
            <Building2 size={15} className={pathname.startsWith("/company") ? "text-teal-400" : ""} />
            Company
          </Link>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150",
              pathname.startsWith("/admin")
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                : "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300"
            )}
          >
            <PlusCircle size={15} />
            Add Data
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-[11px] text-white/25 font-medium">MedTrust Healthcare</p>
        <p className="text-[10px] text-white/15 mt-0.5">Operations v2.0</p>
      </div>

      {lockModal && <LockModal targetHref={lockModal} onClose={() => setLockModal(null)} />}
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { isUnlocked } = useAuth();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [lockModal, setLockModal] = useState<string | null>(null);

  const primaryLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parties", label: "Parties", icon: Users },
    { href: "/visits", label: "Visits", icon: CalendarCheck },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
  ];

  const moreLinks = [
    { href: "/catalog", label: "Product Catalog", icon: Store, special: true },
    { href: "/visitors", label: "Visitors", icon: UserCheck },
    { href: "/products", label: "Products", icon: Package },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
    { href: "/company", label: "Company", icon: Building2 },
    { href: "/admin", label: "Add Data", icon: PlusCircle },
  ];

  const allMoreActive = moreLinks.some(
    ({ href }) => pathname === href || pathname.startsWith(href)
  );

  const handleMoreLinkClick = (href: string) => {
    setShowMore(false);
    if (LOCKED_HREFS.has(href) && !isUnlocked) {
      setLockModal(href);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 left-3 right-3 bg-[#0c1220] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {moreLinks.map(({ href, label, icon: Icon, special }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const locked = LOCKED_HREFS.has(href) && !isUnlocked;
              return (
                <button
                  key={href}
                  onClick={() => handleMoreLinkClick(href)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 text-sm font-medium border-b border-white/5 last:border-0 transition-colors w-full text-left",
                    special
                      ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                      : active ? "text-teal-400 bg-white/5" : locked ? "text-white/30" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {special && !active && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                    </span>
                  )}
                  {locked && <Lock size={11} className="text-white/20" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c1220] border-t border-white/5 flex justify-around px-2 py-2">
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const locked = LOCKED_HREFS.has(href) && !isUnlocked;

          if (locked) {
            return (
              <button
                key={href}
                onClick={() => setLockModal(href)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all",
                  "text-white/20"
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all",
                active ? "text-teal-400 bg-white/5" : "text-white/30 hover:text-white/60"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all",
            showMore || allMoreActive ? "text-teal-400 bg-white/5" : "text-white/30 hover:text-white/60"
          )}
        >
          {showMore ? <X size={18} /> : <MoreHorizontal size={18} />}
          More
        </button>
      </nav>

      {lockModal && <LockModal targetHref={lockModal} onClose={() => setLockModal(null)} />}
    </>
  );
}

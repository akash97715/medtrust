"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Package, CalendarCheck, ShoppingCart,
  DollarSign, PlusCircle,
} from "lucide-react";

const mainLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen fixed top-0 left-0 z-30 bg-[#0c1220]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/30">
          <span className="text-white font-black text-sm tracking-tight">M</span>
        </div>
        <div>
          <p className="font-bold text-white text-[15px] tracking-tight leading-none">MedTrust</p>
          <p className="text-[11px] text-white/30 mt-0.5 font-medium tracking-wide">HEALTHCARE</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 pt-5 flex-1 gap-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 px-3 pb-2">
          Operations
        </p>
        {mainLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
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

        <div className="mt-5 pt-4 border-t border-white/5">
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
        <p className="text-[11px] text-white/25 font-medium">Bihar · West Champaran</p>
        <p className="text-[10px] text-white/15 mt-0.5">Field Operations v2.0</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileLinks = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/parties", label: "Parties", icon: Users },
    { href: "/visits", label: "Visits", icon: CalendarCheck },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin", label: "Add", icon: PlusCircle },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c1220] border-t border-white/5 flex justify-around px-2 py-2">
      {mobileLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all",
              active
                ? "text-teal-400 bg-white/5"
                : "text-white/30 hover:text-white/60"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

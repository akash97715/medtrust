"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Package, CalendarCheck, ShoppingCart,
  DollarSign, PlusCircle, HeartPulse,
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
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-slate-950 fixed top-0 left-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/20 ring-1 ring-teal-500/30">
          <HeartPulse className="text-teal-400" size={16} />
        </div>
        <div>
          <p className="font-bold text-white text-sm tracking-tight leading-none">MedTrust</p>
          <p className="text-slate-500 text-[10px] mt-0.5">Healthcare CRM</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col p-3 flex-1 gap-0.5">
        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-2">
          Operations
        </p>
        {mainLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal-400" />
              )}
              <Icon size={16} className={active ? "text-teal-400" : ""} />
              {label}
            </Link>
          );
        })}

        <div className="mt-4 pt-4 border-t border-slate-800">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname === "/admin"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-teal-600/10 text-teal-400 hover:bg-teal-600/20 hover:text-teal-300"
            )}
          >
            <PlusCircle size={16} />
            Add Data
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-slate-500 text-xs font-medium">Bihar · West Champaran</p>
        <p className="text-slate-700 text-[10px] mt-0.5">Field Operations v2.0</p>
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 z-30 flex justify-around py-2 px-2">
      {mobileLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors",
              active ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Icon size={19} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

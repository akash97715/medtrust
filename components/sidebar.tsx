"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Package, CalendarCheck, ShoppingCart,
  DollarSign, PlusCircle, HeartPulse,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin", label: "Add Data", icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-slate-900 text-slate-100 fixed top-0 left-0 z-30">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
        <HeartPulse className="text-teal-400" size={22} />
        <span className="font-semibold text-base tracking-tight">MedTrust</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-teal-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-30 flex justify-around py-2">
      {links.slice(0, 6).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 text-xs rounded",
            pathname === href || (href !== "/" && pathname.startsWith(href))
              ? "text-teal-400"
              : "text-slate-400"
          )}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

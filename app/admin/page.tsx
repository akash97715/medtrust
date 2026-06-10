"use client";
import Link from "next/link";
import { Users, Package, CalendarCheck, ShoppingCart, ChevronRight } from "lucide-react";

const actions = [
  {
    href: "/admin/party",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    title: "Add Party",
    hindi: "पार्टी जोड़ें",
    desc: "Register a hospital, agency or clinic as a buyer in your area.",
  },
  {
    href: "/admin/product",
    icon: Package,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100",
    title: "Add Product",
    hindi: "उत्पाद जोड़ें",
    desc: "Add a surgical or medical item to the master product list.",
  },
  {
    href: "/admin/visit",
    icon: CalendarCheck,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    title: "Log Visit",
    hindi: "विज़िट दर्ज करें",
    desc: "Record a field visit — who you met, what was needed.",
  },
  {
    href: "/admin/order",
    icon: ShoppingCart,
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
    title: "Add Order",
    hindi: "ऑर्डर जोड़ें",
    desc: "Capture a confirmed order with quantity, buy rate and sell rate.",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-lg mx-auto md:mx-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Add Data</h1>
        <p className="text-slate-500 text-sm mt-1">What would you like to add?</p>
      </div>

      <div className="flex flex-col gap-3">
        {actions.map(({ href, icon: Icon, color, border, title, hindi, desc }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 p-4 bg-white rounded-xl border ${border} hover:shadow-md active:scale-[0.98] transition-all`}
          >
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color} shrink-0`}>
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 text-sm">{title}</p>
                <p className="text-xs text-slate-400">{hindi}</p>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, MobileNav } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";
import { Lock } from "lucide-react";

// Staff can access these (staff + admin)
const STAFF_PREFIXES = ["/visits", "/visitors", "/admin", "/parties", "/catalog-admin"];
// Admin only
const OWNER_PREFIXES = ["/dashboard", "/products", "/orders", "/pricing"];

function requiredRole(pathname: string): "staff" | "admin" | null {
  if (OWNER_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "admin";
  if (STAFF_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "staff";
  return null;
}

function FullPageLock({ level }: { level: "staff" | "admin" }) {
  const { tryUnlock } = useAuth();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const handleComplete = async (pin: string) => {
    setLoading(true);
    setError(false);
    const ok = await tryUnlock(pin);
    setLoading(false);
    if (!ok) {
      setError(true);
      setResetPin((v) => v + 1);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-xs mx-auto text-center px-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mx-auto mb-5">
          <Lock size={24} className="text-slate-400" />
        </div>
        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-teal-500 mb-3">
          <span className="text-white font-black text-xs">M</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          {level === "staff" ? "Staff Access Required" : "Owner Access Required"}
        </h2>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
          {level === "staff"
            ? "Enter your staff code to access this section."
            : "This section is restricted to the owner. Enter your owner code to continue."}
        </p>
        <PinInput onComplete={handleComplete} loading={loading} reset={resetPin} />
        {loading && <p className="text-xs text-slate-400 mt-4">Verifying…</p>}
        {error && <p className="text-xs text-red-500 font-medium mt-4">Incorrect code. Please try again.</p>}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isStaff, isAdmin } = useAuth();

  if (pathname === "/" || pathname.startsWith("/invoices")) {
    return <>{children}</>;
  }

  const needed = requiredRole(pathname);
  const needsLock =
    (needed === "admin" && !isAdmin) ||
    (needed === "staff" && !isStaff);

  return (
    <>
      <Sidebar />
      <MobileNav />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {needsLock ? <FullPageLock level={needed!} /> : children}
          </div>
        </main>
      </div>
    </>
  );
}

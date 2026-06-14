"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, MobileNav } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";
import { Lock } from "lucide-react";

// Routes that require the employee code to access
const PROTECTED_PREFIXES = ["/dashboard", "/products", "/orders", "/pricing", "/catalog-admin", "/visitors"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function FullPageLock() {
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
    // on success the parent re-renders automatically (isUnlocked becomes true)
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-xs mx-auto text-center px-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mx-auto mb-5">
          <Lock size={24} className="text-slate-400" />
        </div>

        {/* Branding */}
        <div className="mb-1">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-teal-500 mb-3">
            <span className="text-white font-black text-xs">M</span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-1">Restricted Access</h2>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
          This section requires an employee code.<br />
          Enter your 5-digit code to unlock all restricted pages for this session.
        </p>

        <PinInput onComplete={handleComplete} loading={loading} reset={resetPin} />

        {loading && (
          <p className="text-xs text-slate-400 mt-4">Verifying…</p>
        )}
        {error && (
          <p className="text-xs text-red-500 font-medium mt-4">
            Incorrect code. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isUnlocked } = useAuth();

  if (pathname === "/" || pathname.startsWith("/invoices")) {
    return <>{children}</>;
  }

  const needsLock = isProtected(pathname) && !isUnlocked;

  return (
    <>
      <Sidebar />
      <MobileNav />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {needsLock ? <FullPageLock /> : children}
          </div>
        </main>
      </div>
    </>
  );
}

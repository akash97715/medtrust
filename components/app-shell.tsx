"use client";
import { usePathname } from "next/navigation";
import { Sidebar, MobileNav } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/invoices")) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <MobileNav />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

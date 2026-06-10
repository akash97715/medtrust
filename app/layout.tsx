import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { Header } from "@/components/header";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "MedTrust Healthcare",
  description: "Medical supply field operations dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}

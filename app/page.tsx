import Link from "next/link";
import { ArrowRight, ShieldCheck, Award, BadgeCheck, MapPin } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0c1220] flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/40">
            <span className="text-white font-black text-sm tracking-tight">M</span>
          </div>
          <div>
            <p className="font-bold text-white text-[15px] tracking-tight leading-none">MedTrust</p>
            <p className="text-[10px] text-white/30 font-semibold tracking-widest">HEALTHCARE</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 hover:border-white/20"
        >
          Sign In
          <ArrowRight size={13} />
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-teal-300 text-xs font-semibold tracking-wide">GST Registered · MSME Certified · Active</span>
        </div>

        {/* Wordmark */}
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-3">
          MedTrust
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white/20 tracking-tight mb-6">
          Healthcare
        </h2>

        <p className="text-white/50 text-base md:text-lg max-w-md leading-relaxed mb-10">
          Medical and pharmaceutical supply distribution across Bihar. Retail trade in pharmaceuticals, orthopaedic goods and healthcare consumables.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-3 bg-teal-500 hover:bg-teal-400 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-teal-500/25 hover:shadow-teal-400/40 transition-all duration-200 hover:-translate-y-0.5"
        >
          Open Operations Dashboard
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <p className="text-white/20 text-xs mt-4 font-medium">Field operations · Bihar, West Champaran</p>

        {/* Credential cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-16 w-full max-w-2xl">
          {[
            {
              icon: ShieldCheck,
              label: "GST Registration",
              value: "29EYSPS5133L1ZF",
              sub: "Govt. of India · Regular",
              color: "teal",
            },
            {
              icon: Award,
              label: "Udyam · MSME",
              value: "UDYAM-KR-03-0706248",
              sub: "Micro Enterprise · 2026",
              color: "indigo",
            },
            {
              icon: MapPin,
              label: "Field Operations",
              value: "West Champaran",
              sub: "Bihar · North India",
              color: "amber",
            },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div
              key={label}
              className="bg-white/4 border border-white/8 rounded-2xl p-4 text-left hover:bg-white/6 transition-colors"
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${
                color === "teal" ? "bg-teal-500/15" :
                color === "indigo" ? "bg-indigo-500/15" : "bg-amber-500/15"
              }`}>
                <Icon size={15} className={
                  color === "teal" ? "text-teal-400" :
                  color === "indigo" ? "text-indigo-400" : "text-amber-400"
                } />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">{label}</p>
              <p className="font-mono font-bold text-white text-xs tracking-wide leading-snug">{value}</p>
              <p className="text-[11px] text-white/30 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <BadgeCheck size={14} className="text-teal-500" />
            <p className="text-xs text-white/30 font-medium">
              MEDTRUST HEALTH CARE · Proprietorship · Karnataka
            </p>
          </div>
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} MedTrust Healthcare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

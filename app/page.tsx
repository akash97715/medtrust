import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ShieldCheck, BadgeCheck,
  Zap, Building2, Phone, Package,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080e1a] text-white flex flex-col relative">

      {/* ── BACKGROUND IMAGE (fixed, doesn't scroll) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1920&q=80"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Base dark overlay — keeps text fully readable */}
        <div className="absolute inset-0 bg-[#080e1a]/82" />
        {/* Radial vignette — edges slightly lighter so image breathes */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 40%, transparent 0%, rgba(8,14,26,0.25) 100%)" }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="relative z-20 sticky top-0 border-b border-white/[0.06] bg-[#080e1a]/90 backdrop-blur-md px-5 md:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/40 shrink-0">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div>
            <p className="font-black text-white text-[15px] tracking-tight leading-none">MedTrust</p>
            <p className="text-[9px] text-teal-400/70 font-bold tracking-[0.2em]">HEALTHCARE</p>
            <p className="text-[8px] text-white/25 font-semibold tracking-[0.08em] mt-0.5">Reliable · Rapid · Cost-Optimal</p>
          </div>
        </div>
        <Link
          href="/company"
          className="text-xs font-semibold text-white/50 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
        >
          Our Company
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-16 md:py-24 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
          <span className="text-teal-300 text-[11px] font-bold tracking-widest uppercase">GST Registered · MSME Certified</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] text-white max-w-2xl mb-4">
          Surgical &amp; Medical{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">
            Supplies
          </span>
          <br />You Can Trust
        </h1>

        {/* Tagline */}
        <p className="text-[13px] md:text-sm font-bold tracking-[0.22em] uppercase text-white/35 mb-7">
          Reliable &nbsp;·&nbsp; Rapid &nbsp;·&nbsp; Cost-Optimal
        </p>

        {/* Three pillars */}
        <div className="flex items-stretch divide-x divide-white/10 bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden mb-8">
          {[
            { icon: "🛡️", title: "Reliable", sub: "Certified sources, zero compromise" },
            { icon: "⚡", title: "Rapid",    sub: "Swift delivery, pan-India" },
            { icon: "💎", title: "Cost-Optimal", sub: "No middlemen, best-market rates" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex-1 flex flex-col items-center text-center px-4 py-4 md:px-6">
              <span className="text-xl mb-1.5">{icon}</span>
              <p className="text-white font-bold text-[13px] tracking-tight">{title}</p>
              <p className="text-white/35 text-[10px] font-medium leading-snug mt-0.5 hidden sm:block">{sub}</p>
            </div>
          ))}
        </div>

        {/* Subtext */}
        <p className="text-white/50 text-sm md:text-base font-medium max-w-sm mb-10 leading-relaxed">
          Genuine certified products for hospitals, clinics &amp; agencies —
          at the <span className="text-white/75 font-semibold">lowest market rates</span>, delivered quickly.
        </p>

        {/* Primary CTA */}
        <Link
          href="/catalog"
          className="group flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-black text-base px-8 py-4 rounded-2xl shadow-2xl shadow-amber-500/30 transition-all duration-150 active:scale-[0.97] w-full max-w-xs md:w-auto tracking-wide"
        >
          <Package size={18} />
          Browse Products
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Trust stats */}
        <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
          {[
            { value: "20+", label: "Hospitals Served" },
            { value: "Swift", label: "Delivery" },
            { value: "₹0", label: "Hidden Charges" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[11px] text-white/40 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="relative z-10 border-t border-white/[0.06]" />

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-5 md:px-10 py-12 md:py-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: BadgeCheck,
              color: "text-teal-400",
              border: "border-teal-500/20",
              title: "100% Genuine",
              desc: "Sourced directly from certified manufacturers. No counterfeit, no compromise.",
            },
            {
              icon: Zap,
              color: "text-amber-400",
              border: "border-amber-500/20",
              title: "Lowest Market Rates",
              desc: "No middlemen. Direct pricing means you save more on every order.",
            },
            {
              icon: ShieldCheck,
              color: "text-blue-400",
              border: "border-blue-500/20",
              title: "GST-Compliant Billing",
              desc: "Fully GST-registered. Proper tax invoices on every single order.",
            },
          ].map(({ icon: Icon, color, border, title, desc }) => (
            <div key={title} className={`rounded-2xl border ${border} bg-white/[0.04] backdrop-blur-md p-5`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-white/[0.06]`}>
                <Icon size={18} className={color} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-5 md:px-10 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Link href="/company" className="group flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
              <Building2 size={13} />
              <span className="text-xs font-semibold">About MedTrust</span>
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <span className="text-white/15 hidden sm:block">·</span>
            <a href="tel:+918789198929" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
              <Phone size={12} />
              <span className="text-xs font-semibold">+91 87891 98929</span>
            </a>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="text-[10px] text-white/25 font-mono">GST: 29EYSPS5133L1ZF · UDYAM-KR-03-0706248</span>
            <span className="text-[10px] text-white/20 font-semibold">&copy; {new Date().getFullYear()} MedTrust Healthcare</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

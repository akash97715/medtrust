import Link from "next/link";
import {
  ArrowRight, ShieldCheck, BadgeCheck, Star, Zap,
  Package, HeartPulse, Scissors, Bandage, Building2, LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="h-screen flex flex-col bg-[#0c1220] text-white overflow-hidden">

      {/* ── NAVBAR ── */}
      <nav className="shrink-0 border-b border-white/5 px-6 md:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/40 shrink-0">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div>
            <p className="font-bold text-white text-[14px] tracking-tight leading-none">MedTrust</p>
            <p className="text-[9px] text-white/30 font-semibold tracking-[0.15em]">HEALTHCARE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/company" className="text-xs font-medium text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            About
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-teal-500/20">
            Dashboard <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── MAIN AREA — fills remaining height ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* LEFT: Brand hero */}
        <div className="md:w-[42%] shrink-0 flex flex-col justify-center px-8 md:px-12 py-8 border-b md:border-b-0 md:border-r border-white/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(20,184,166,0.08),_transparent_60%)] pointer-events-none" />
          <div className="relative">
            {/* Status */}
            <div className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
              <span className="text-teal-300 text-[11px] font-semibold">GST Registered · MSME Certified</span>
            </div>

            {/* Wordmark */}
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none text-white">MedTrust</h1>
            <h2 className="text-xl md:text-2xl font-bold text-white/20 tracking-tight mt-1 mb-4">Healthcare</h2>

            <p className="text-white/50 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
              Genuine medical &amp; surgical supplies at the <span className="text-white/80 font-semibold">lowest market rates</span> — trusted by hospitals, clinics and healthcare agencies.
            </p>

            {/* CTA */}
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-xl shadow-teal-500/25 transition-all duration-150 hover:-translate-y-0.5 mb-6"
            >
              Open Operations Dashboard
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Trust bullets */}
            <div className="space-y-2">
              {[
                { icon: BadgeCheck, text: "100% Genuine products — direct from manufacturers" },
                { icon: Star, text: "Lowest market rates — no middlemen" },
                { icon: ShieldCheck, text: "GST-compliant billing on every order" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={13} className="text-teal-400 shrink-0" />
                  <p className="text-white/45 text-xs">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Clickable cards grid */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-3 px-1">Quick Access</p>
          <div className="grid grid-cols-2 gap-3 h-[calc(100%-28px)]">

            {/* Card 1 — Our Products */}
            <Link href="/products" className="group bg-white/4 hover:bg-white/7 border border-white/8 hover:border-teal-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150">
              <div>
                <div className="bg-teal-500/15 p-2.5 rounded-xl w-fit mb-3">
                  <Package size={18} className="text-teal-400" />
                </div>
                <h3 className="font-bold text-white text-base leading-tight mb-1.5">Our Products</h3>
                <p className="text-white/40 text-xs leading-relaxed">
                  Medicines, surgical tools, orthopaedic items, bandages, gloves and diagnostic supplies — all under one roof.
                </p>
              </div>
              <div className="flex items-center gap-1 text-teal-400 text-xs font-semibold mt-4 group-hover:gap-2 transition-all">
                View catalog <ArrowRight size={12} />
              </div>
            </Link>

            {/* Card 2 — Why Choose Us */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col">
              <div className="bg-amber-500/15 p-2.5 rounded-xl w-fit mb-3">
                <Star size={18} className="text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-base leading-tight mb-3">Why Choose Us</h3>
              <div className="space-y-2 flex-1">
                {[
                  { icon: Zap, text: "Lowest price — compare &amp; verify" },
                  { icon: BadgeCheck, text: "No fakes — certified manufacturers" },
                  { icon: ShieldCheck, text: "Proper GST invoice every time" },
                  { icon: HeartPulse, text: "Trusted by 20+ hospitals &amp; clinics" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon size={12} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-white/45 text-xs leading-snug" dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Surgical Focus */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col">
              <div className="bg-indigo-500/15 p-2.5 rounded-xl w-fit mb-3">
                <Scissors size={18} className="text-indigo-400" />
              </div>
              <h3 className="font-bold text-white text-base leading-tight mb-1">Surgical Supplies</h3>
              <p className="text-[10px] text-indigo-400/70 font-medium mb-2">ऑपरेशन का सामान</p>
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                {[
                  { icon: Scissors, label: "Instruments" },
                  { icon: Bandage, label: "Wound Care" },
                  { icon: HeartPulse, label: "Medicines" },
                  { icon: Package, label: "Orthopaedic" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-white/4 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                    <Icon size={10} className="text-white/30 shrink-0" />
                    <span className="text-white/50 text-[10px] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4 — Dashboard entry */}
            <Link href="/dashboard" className="group bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150">
              <div>
                <div className="bg-teal-500/20 p-2.5 rounded-xl w-fit mb-3">
                  <LayoutDashboard size={18} className="text-teal-400" />
                </div>
                <h3 className="font-bold text-white text-base leading-tight mb-1.5">Operations Dashboard</h3>
                <p className="text-white/40 text-xs leading-relaxed">
                  Manage parties, log visits, track orders and view pricing — your full ops centre.
                </p>
              </div>
              <div className="flex items-center gap-1 text-teal-400 text-xs font-semibold mt-4 group-hover:gap-2 transition-all">
                Enter app <ArrowRight size={12} />
              </div>
            </Link>

            {/* Card 5 — Company Info (spans full width) */}
            <Link href="/company" className="group col-span-2 bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl px-5 py-4 flex items-center justify-between transition-all duration-150">
              <div className="flex items-center gap-4">
                <div className="bg-white/6 p-2.5 rounded-xl shrink-0">
                  <Building2 size={18} className="text-white/50" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Company Profile &amp; Certifications</h3>
                  <p className="text-white/35 text-xs mt-0.5">GST: 29EYSPS5133L1ZF · Udyam: UDYAM-KR-03-0706248 · MSME Micro Enterprise</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-white/25 group-hover:text-white/60 shrink-0 ml-4 transition-colors" />
            </Link>

          </div>
        </div>
      </div>

      {/* ── FOOTER STRIP ── */}
      <div className="shrink-0 border-t border-white/5 bg-black/20 px-6 md:px-10 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-white/20 font-mono">GST 29EYSPS5133L1ZF</span>
          <span className="text-white/10">·</span>
          <span className="text-[10px] text-white/20 font-mono">UDYAM-KR-03-0706248</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BadgeCheck size={11} className="text-teal-500/50" />
          <span className="text-[10px] text-white/20">&copy; {new Date().getFullYear()} MedTrust Healthcare</span>
        </div>
      </div>

    </div>
  );
}

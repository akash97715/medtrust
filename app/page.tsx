import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ShieldCheck, BadgeCheck, Star,
  Package, HeartPulse, Scissors, LayoutDashboard, Building2, Zap,
} from "lucide-react";

// High-quality, verified Unsplash medical/surgical images
const IMGS = {
  hero:      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  products:  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
  surgical:  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80",
  hospital:  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  doctor:    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80",
};

export default function LandingPage() {
  return (
    <div className="h-screen flex flex-col bg-[#0c1220] text-white overflow-hidden">

      {/* ── NAVBAR ── */}
      <nav className="shrink-0 border-b border-white/5 px-6 md:px-10 h-14 flex items-center justify-between z-10">
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

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* LEFT: Hero with background image */}
        <div className="md:w-[40%] shrink-0 relative flex flex-col justify-end overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          {/* Background image */}
          <Image
            src={IMGS.hero}
            alt="Medical professional"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/70 to-[#0c1220]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1220]/20 to-transparent" />

          {/* Content over image */}
          <div className="relative z-10 p-8 md:p-10">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/15 border border-teal-500/25 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
              <span className="text-teal-300 text-[11px] font-semibold">GST Registered · MSME Certified</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white mb-1">MedTrust</h1>
            <h2 className="text-lg font-bold text-white/30 tracking-tight mb-3">Healthcare</h2>

            <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-xs">
              Genuine medical &amp; surgical supplies at the <span className="text-white font-semibold">lowest market rates</span> — trusted by hospitals, clinics and agencies.
            </p>

            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-xl shadow-teal-500/30 transition-all duration-150 hover:-translate-y-0.5 mb-5"
            >
              Open Operations Dashboard
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="space-y-1.5">
              {[
                { icon: BadgeCheck, text: "100% Genuine — certified manufacturers only" },
                { icon: Star,       text: "Lowest market rates — no middlemen" },
                { icon: ShieldCheck,text: "GST-compliant billing on every order" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={12} className="text-teal-400 shrink-0" />
                  <p className="text-white/45 text-xs">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Cards grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 min-h-0">
          <div className="grid grid-cols-2 gap-3 h-full" style={{ gridTemplateRows: "1fr 1fr auto" }}>

            {/* Card 1 — Products */}
            <Link href="/products" className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-teal-500/40 transition-all duration-200 min-h-[140px]">
              <Image src={IMGS.products} alt="Medical products" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/60 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 p-2 rounded-xl w-fit">
                  <Package size={15} className="text-teal-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">Our Products</h3>
                  <p className="text-white/50 text-xs mt-0.5">Medicines, surgical tools, orthopaedic &amp; more</p>
                  <div className="flex items-center gap-1 text-teal-400 text-[11px] font-semibold mt-2 group-hover:gap-1.5 transition-all">
                    View catalog <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 2 — Surgical Supplies */}
            <Link href="/products" className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-indigo-500/40 transition-all duration-200 min-h-[140px]">
              <Image src={IMGS.surgical} alt="Surgical instruments" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/55 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 p-2 rounded-xl w-fit">
                  <Scissors size={15} className="text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Surgical Supplies</h3>
                  <p className="text-white/50 text-xs mt-0.5">ऑपरेशन का सामान · Instruments &amp; wound care</p>
                  <div className="flex items-center gap-1 text-indigo-400 text-[11px] font-semibold mt-2 group-hover:gap-1.5 transition-all">
                    Explore <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 3 — Why Choose Us */}
            <div className="group relative rounded-2xl overflow-hidden border border-white/8 min-h-[140px]">
              <Image src={IMGS.hospital} alt="Hospital" fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/75 to-[#0c1220]/40" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 p-2 rounded-xl w-fit">
                  <Star size={15} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-2">Why Choose Us</h3>
                  <div className="space-y-1">
                    {[
                      { icon: Zap,         text: "Lowest price in market" },
                      { icon: BadgeCheck,  text: "No fakes, certified only" },
                      { icon: HeartPulse,  text: "Trusted by 20+ hospitals" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-1.5">
                        <Icon size={10} className="text-amber-400 shrink-0" />
                        <p className="text-white/55 text-[11px]">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 — Dashboard */}
            <Link href="/dashboard" className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-teal-500/50 transition-all duration-200 min-h-[140px]">
              <Image src={IMGS.doctor} alt="Healthcare professional" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/65 to-[#0c1220]/30" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 p-2 rounded-xl w-fit">
                  <LayoutDashboard size={15} className="text-teal-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Operations Dashboard</h3>
                  <p className="text-white/50 text-xs mt-0.5">Parties, orders, visits &amp; pricing</p>
                  <div className="flex items-center gap-1 text-teal-400 text-[11px] font-semibold mt-2 group-hover:gap-1.5 transition-all">
                    Enter app <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 5 — Company (spans full width) */}
            <Link href="/company" className="group col-span-2 relative rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-200 h-12">
              <div className="absolute inset-0 bg-white/3 group-hover:bg-white/5 transition-colors" />
              <div className="relative h-full flex items-center justify-between px-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/8 p-1.5 rounded-lg">
                    <Building2 size={14} className="text-white/50" />
                  </div>
                  <div>
                    <span className="font-bold text-white/80 text-xs">Company Profile &amp; Certifications</span>
                    <span className="text-white/30 text-[10px] ml-3 font-mono">GST: 29EYSPS5133L1ZF · Udyam: UDYAM-KR-03-0706248</span>
                  </div>
                </div>
                <ArrowRight size={13} className="text-white/25 group-hover:text-white/60 shrink-0 transition-colors" />
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* ── FOOTER STRIP ── */}
      <div className="shrink-0 border-t border-white/5 bg-black/20 px-6 md:px-10 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-white/20 font-mono">GST 29EYSPS5133L1ZF</span>
          <span className="text-white/10 hidden sm:block">·</span>
          <span className="text-[10px] text-white/20 font-mono hidden sm:block">UDYAM-KR-03-0706248</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BadgeCheck size={11} className="text-teal-500/50" />
          <span className="text-[10px] text-white/20">&copy; {new Date().getFullYear()} MedTrust Healthcare</span>
        </div>
      </div>

    </div>
  );
}

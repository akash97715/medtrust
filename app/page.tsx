import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ShieldCheck, BadgeCheck, Star,
  Package, HeartPulse, Scissors, LayoutDashboard, Building2, Zap,
} from "lucide-react";

const IMGS = {
  hero:     "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  products: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
  surgical: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80",
  hospital: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  doctor:   "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80",
};

// Reusable text-shadow style for on-image text
const shadow = { textShadow: "0 1px 12px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.6)" } as React.CSSProperties;

export default function LandingPage() {
  return (
    <div className="h-screen flex flex-col bg-[#0c1220] text-white overflow-hidden">

      {/* ── NAVBAR ── */}
      <nav className="shrink-0 border-b border-white/8 px-6 md:px-10 h-14 flex items-center justify-between z-10 bg-[#0c1220]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 shadow-lg shadow-teal-500/40 shrink-0">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div>
            <p className="font-black text-white text-[15px] tracking-tight leading-none">MedTrust</p>
            <p className="text-[9px] text-teal-400/70 font-bold tracking-[0.2em]">HEALTHCARE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/company" className="text-xs font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors">
            About
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors shadow-lg shadow-teal-500/25 tracking-wide">
            Dashboard <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* LEFT HERO */}
        <div className="md:w-[40%] shrink-0 relative flex flex-col justify-end overflow-hidden border-b md:border-b-0 md:border-r border-white/8">
          <Image src={IMGS.hero} alt="Medical professional" fill className="object-cover object-center" priority />
          {/* Stronger gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/80 to-[#0a0f1c]/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1c]/30 to-transparent" />

          <div className="relative z-10 p-8 md:p-10">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 bg-teal-400/20 border border-teal-400/40 rounded-full px-3.5 py-1.5 mb-5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
              <span className="text-teal-200 text-[11px] font-bold tracking-wide">GST Registered · MSME Certified</span>
            </div>

            {/* Brand name */}
            <h1
              className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-white mb-1"
              style={shadow}
            >
              MedTrust
            </h1>
            <h2
              className="text-xl font-extrabold text-teal-400 tracking-wide mb-4"
              style={shadow}
            >
              Healthcare
            </h2>

            {/* Tagline */}
            <p className="text-white/90 text-sm md:text-[15px] font-medium leading-relaxed mb-6 max-w-xs" style={shadow}>
              Genuine medical &amp; surgical supplies at the{" "}
              <span className="text-teal-300 font-extrabold">lowest market rates</span>
              {" "}— trusted by hospitals, clinics and agencies.
            </p>

            {/* CTA */}
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 bg-teal-500 hover:bg-teal-400 text-white font-black text-sm px-6 py-3 rounded-xl shadow-2xl shadow-teal-500/40 transition-all duration-150 hover:-translate-y-0.5 mb-6 tracking-wide"
            >
              Open Operations Dashboard
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Trust bullets */}
            <div className="space-y-2">
              {[
                { icon: BadgeCheck, text: "100% Genuine — certified manufacturers only" },
                { icon: Star,        text: "Lowest market rates — no middlemen" },
                { icon: ShieldCheck, text: "GST-compliant billing on every order" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon size={13} className="text-teal-400 shrink-0 drop-shadow" />
                  <p className="text-white/80 text-xs font-semibold" style={shadow}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CARDS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 min-h-0">
          <div className="grid grid-cols-2 gap-3 h-full" style={{ gridTemplateRows: "1fr 1fr auto" }}>

            {/* Card 1 — Products */}
            <Link href="/products" className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-teal-400/60 transition-all duration-200 min-h-[140px]">
              <Image src={IMGS.products} alt="Medical products" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-teal-400/25 backdrop-blur-md border border-teal-400/40 p-2 rounded-xl w-fit">
                  <Package size={15} className="text-teal-200" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight tracking-tight" style={shadow}>Our Products</h3>
                  <p className="text-white/80 text-xs font-semibold mt-1" style={shadow}>Medicines, surgical tools, orthopaedic &amp; more</p>
                  <div className="flex items-center gap-1 text-teal-300 text-[11px] font-black mt-2.5 group-hover:gap-2 transition-all tracking-wide">
                    View catalog <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 2 — Surgical */}
            <Link href="/products" className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-400/60 transition-all duration-200 min-h-[140px]">
              <Image src={IMGS.surgical} alt="Surgical instruments" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-indigo-400/25 backdrop-blur-md border border-indigo-400/40 p-2 rounded-xl w-fit">
                  <Scissors size={15} className="text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base tracking-tight" style={shadow}>Surgical Supplies</h3>
                  <p className="text-white/80 text-xs font-semibold mt-1" style={shadow}>ऑपरेशन का सामान · Instruments &amp; wound care</p>
                  <div className="flex items-center gap-1 text-indigo-300 text-[11px] font-black mt-2.5 group-hover:gap-2 transition-all tracking-wide">
                    Explore <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 3 — Why Choose Us */}
            <div className="group relative rounded-2xl overflow-hidden border border-white/10 min-h-[140px]">
              <Image src={IMGS.hospital} alt="Hospital" fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/65 to-black/20" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-amber-400/25 backdrop-blur-md border border-amber-400/40 p-2 rounded-xl w-fit">
                  <Star size={15} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base tracking-tight mb-2.5" style={shadow}>Why Choose Us</h3>
                  <div className="space-y-1.5">
                    {[
                      { icon: Zap,        text: "Lowest price in market" },
                      { icon: BadgeCheck, text: "No fakes — certified only" },
                      { icon: HeartPulse, text: "Trusted by 20+ hospitals" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Icon size={11} className="text-amber-300 shrink-0" />
                        <p className="text-white/85 text-xs font-semibold" style={shadow}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 — Dashboard */}
            <Link href="/dashboard" className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-teal-400/60 transition-all duration-200 min-h-[140px]">
              <Image src={IMGS.doctor} alt="Healthcare professional" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-teal-400/25 backdrop-blur-md border border-teal-400/40 p-2 rounded-xl w-fit">
                  <LayoutDashboard size={15} className="text-teal-200" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base tracking-tight" style={shadow}>Operations Dashboard</h3>
                  <p className="text-white/80 text-xs font-semibold mt-1" style={shadow}>Parties, orders, visits &amp; pricing</p>
                  <div className="flex items-center gap-1 text-teal-300 text-[11px] font-black mt-2.5 group-hover:gap-2 transition-all tracking-wide">
                    Enter app <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 5 — Company (full width) */}
            <Link href="/company" className="group col-span-2 relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-200 h-12">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/8 transition-colors" />
              <div className="relative h-full flex items-center justify-between px-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-1.5 rounded-lg">
                    <Building2 size={14} className="text-white/70" />
                  </div>
                  <span className="font-black text-white text-xs tracking-wide">Company Profile &amp; Certifications</span>
                  <span className="text-white/45 text-[10px] font-mono hidden sm:block">GST: 29EYSPS5133L1ZF · Udyam: UDYAM-KR-03-0706248</span>
                </div>
                <ArrowRight size={13} className="text-white/40 group-hover:text-white shrink-0 transition-colors" />
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 border-t border-white/8 bg-black/30 px-6 md:px-10 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-white/35 font-mono font-semibold">GST 29EYSPS5133L1ZF</span>
          <span className="text-white/15 hidden sm:block">·</span>
          <span className="text-[10px] text-white/35 font-mono font-semibold hidden sm:block">UDYAM-KR-03-0706248</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BadgeCheck size={11} className="text-teal-400/70" />
          <span className="text-[10px] text-white/40 font-semibold">&copy; {new Date().getFullYear()} MedTrust Healthcare</span>
        </div>
      </div>

    </div>
  );
}

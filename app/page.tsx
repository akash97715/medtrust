import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ShieldCheck, BadgeCheck, Star,
  HeartPulse, Building2, Zap, Store,
} from "lucide-react";

const IMGS = {
  hero:     "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  products: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
  hospital: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
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
          <Link href="/catalog" className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors shadow-lg shadow-amber-500/30 tracking-wide">
            View Catalog <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* LEFT HERO */}
        <div className="md:w-[40%] shrink-0 relative flex flex-col justify-end overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-white/20">
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
              href="/catalog"
              className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-sm px-6 py-3 rounded-xl shadow-2xl shadow-amber-500/40 transition-all duration-150 hover:-translate-y-0.5 mb-6 tracking-wide"
            >
              <Store size={15} />
              Browse Product Catalog
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
          <div className="flex flex-col gap-3 h-full">

            {/* Hero catalog card */}
            <Link
              href="/catalog"
              className="group relative rounded-2xl overflow-hidden border-2 border-amber-400/60 hover:border-amber-400 transition-all duration-200 flex-1 min-h-[180px] shadow-lg shadow-amber-500/10"
            >
              <Image src={IMGS.products} alt="Product catalog" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

              {/* Pulsing badge */}
              <div className="absolute top-4 right-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
                </span>
              </div>

              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div className="bg-amber-400/25 backdrop-blur-md border border-amber-400/50 p-2.5 rounded-xl w-fit">
                  <Store size={17} className="text-amber-200" />
                </div>
                <div>
                  <p className="text-amber-300 text-[10px] font-black uppercase tracking-[0.15em] mb-1" style={shadow}>
                    Surgical &amp; Medical Supplies
                  </p>
                  <h3 className="font-black text-white text-xl leading-tight tracking-tight mb-1.5" style={shadow}>
                    Product Catalog
                  </h3>
                  <p className="text-white/75 text-xs font-semibold mb-4" style={shadow}>
                    Sutures, gloves, syringes &amp; more — all deliveries within 2 days
                  </p>
                  <div className="inline-flex items-center gap-2 bg-amber-500 group-hover:bg-amber-400 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors tracking-wide shadow-lg shadow-amber-500/30">
                    Browse All Products <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Why Choose Us */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-white/15 min-h-[130px]">
              <Image src={IMGS.hospital} alt="Hospital" fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/65 to-black/20" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="bg-amber-400/25 backdrop-blur-md border border-amber-400/40 p-2 rounded-xl w-fit">
                  <Star size={15} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm tracking-tight mb-2" style={shadow}>Why Choose Us</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {[
                      { icon: Zap,        text: "Lowest market rates" },
                      { icon: BadgeCheck, text: "Certified products only" },
                      { icon: HeartPulse, text: "Trusted by 20+ hospitals" },
                      { icon: ShieldCheck, text: "GST-compliant billing" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-1.5">
                        <Icon size={10} className="text-amber-300 shrink-0" />
                        <p className="text-white/85 text-[11px] font-semibold" style={shadow}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Company strip */}
            <Link href="/company" className="group relative rounded-2xl overflow-hidden border-2 border-white/15 hover:border-white/35 transition-all duration-200 h-11 shrink-0">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/8 transition-colors" />
              <div className="relative h-full flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-1.5 rounded-lg">
                    <Building2 size={13} className="text-white/70" />
                  </div>
                  <span className="font-black text-white text-xs tracking-wide">Company Profile &amp; Certifications</span>
                  <span className="text-white/40 text-[10px] font-mono hidden sm:block">GST: 29EYSPS5133L1ZF · Udyam: UDYAM-KR-03-0706248</span>
                </div>
                <ArrowRight size={12} className="text-white/35 group-hover:text-white shrink-0 transition-colors" />
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

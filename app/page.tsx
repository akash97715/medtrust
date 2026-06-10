import Link from "next/link";
import { ArrowRight, ShieldCheck, BadgeCheck, CheckCircle2, Star, Zap, Package, HeartPulse, Scissors, Bandage, FlaskConical, Eye } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0c1220] text-white">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#0c1220]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500 shadow-lg shadow-teal-500/40">
              <span className="text-white font-black text-base">M</span>
            </div>
            <div>
              <p className="font-bold text-white text-[15px] tracking-tight leading-none">MedTrust</p>
              <p className="text-[10px] text-white/30 font-semibold tracking-[0.15em]">HEALTHCARE</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
          >
            Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-xs font-semibold tracking-wide">GST Registered · MSME Certified · Government Approved</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-4">
            MedTrust
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold text-white/25 tracking-tight mb-6">
            Healthcare
          </h2>
          <p className="text-white/55 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
            Genuine medical &amp; surgical supplies at the lowest market rates — trusted by hospitals, clinics and healthcare agencies.
          </p>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-2xl shadow-teal-500/30 hover:shadow-teal-400/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            Open Operations Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="border-y border-white/5 bg-white/2">
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "GST No.", value: "29EYSPS5133L1ZF" },
            { label: "Udyam No.", value: "UDYAM-KR-03-0706248" },
            { label: "Enterprise Type", value: "MSME · Micro" },
            { label: "Registration", value: "Govt. of India · Regular" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1">{item.label}</p>
              <p className="font-mono font-bold text-white/70 text-xs md:text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY CHOOSE US ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Why MedTrust</p>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight">Why hospitals choose us</h3>
          <p className="text-white/40 mt-3 text-base max-w-lg mx-auto">
            We keep it simple — genuine products, fair prices, no middlemen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: BadgeCheck,
              title: "100% Genuine Products",
              desc: "Every item we supply comes directly from certified manufacturers. No duplicate, no fake — you get exactly what the label says.",
              accent: "teal",
            },
            {
              icon: Star,
              title: "Lowest Market Rates",
              desc: "We buy in bulk directly from the source and pass the savings to you. Compare our prices — you won't find cheaper for the same quality.",
              accent: "amber",
            },
            {
              icon: ShieldCheck,
              title: "GST-Compliant Billing",
              desc: "Every order comes with a proper GST invoice. Full transparency, clean records — your accounts department will thank you.",
              accent: "indigo",
            },
            {
              icon: Zap,
              title: "Reliable Supply",
              desc: "We maintain healthy stock of fast-moving surgical and medical items so your ward never runs short at a critical moment.",
              accent: "teal",
            },
            {
              icon: HeartPulse,
              title: "Trusted by Clinics & Hospitals",
              desc: "Doctors, purchase officers and store managers rely on us because we deliver what we promise — on time, every time.",
              accent: "rose",
            },
            {
              icon: CheckCircle2,
              title: "Easy Ordering & Tracking",
              desc: "Place orders, track deliveries and view your full purchase history from one dashboard — built for busy hospital staff.",
              accent: "emerald",
            },
          ].map(({ icon: Icon, title, desc, accent }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 hover:border-white/12 transition-all duration-150">
              <div className={`inline-flex p-2.5 rounded-xl mb-4 ${
                accent === "teal" ? "bg-teal-500/15" :
                accent === "amber" ? "bg-amber-500/15" :
                accent === "indigo" ? "bg-indigo-500/15" :
                accent === "rose" ? "bg-rose-500/15" : "bg-emerald-500/15"
              }`}>
                <Icon size={18} className={
                  accent === "teal" ? "text-teal-400" :
                  accent === "amber" ? "text-amber-400" :
                  accent === "indigo" ? "text-indigo-400" :
                  accent === "rose" ? "text-rose-400" : "text-emerald-400"
                } />
              </div>
              <h4 className="font-bold text-white text-base mb-2">{title}</h4>
              <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="border-t border-white/5 bg-white/2">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">What We Supply</p>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">Our Products</h3>
            <p className="text-white/40 mt-3 text-base max-w-lg mx-auto">
              Everything a hospital, clinic or medical store needs — under one roof.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: HeartPulse,
                name: "Medicines & Tablets",
                hindi: "दवाइयाँ और गोलियाँ",
                desc: "Daily medicines, pain killers, antibiotics, vitamins and other tablets and syrups that hospitals and clinics use every day to treat patients.",
                tag: "Pharmaceuticals",
              },
              {
                icon: Scissors,
                name: "Surgical Instruments",
                hindi: "ऑपरेशन के औज़ार",
                desc: "Scissors, forceps, clamps, scalpels and other tools used by doctors during operations and minor procedures — all made from high-grade steel.",
                tag: "Surgical",
              },
              {
                icon: Package,
                name: "Orthopaedic Supplies",
                hindi: "हड्डी और जोड़ का सामान",
                desc: "Knee braces, elbow supports, cervical collars, crepe bandages and other items that help patients recover from fractures and joint pain.",
                tag: "Orthopaedic",
              },
              {
                icon: Bandage,
                name: "Wound Care & Dressings",
                hindi: "पट्टी और घाव का सामान",
                desc: "Bandages, gauze, cotton wool, surgical tape, antiseptic dressings — everything needed to clean a wound and help it heal safely.",
                tag: "Consumables",
              },
              {
                icon: Eye,
                name: "Protective & Safety Gear",
                hindi: "दस्ताने और सुरक्षा सामान",
                desc: "Disposable gloves, surgical masks, face shields, gowns and caps that keep both doctors and patients safe from infection in the hospital.",
                tag: "PPE",
              },
              {
                icon: FlaskConical,
                name: "Diagnostic & Lab Supplies",
                hindi: "जाँच का सामान",
                desc: "Test strips, syringes, IV sets, specimen containers and other items used in labs and wards to diagnose and monitor patient health.",
                tag: "Diagnostics",
              },
            ].map(({ icon: Icon, name, hindi, desc, tag }) => (
              <div key={name} className="bg-[#0c1220] border border-white/8 rounded-2xl p-6 flex flex-col gap-3 hover:border-teal-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="bg-teal-500/12 p-2.5 rounded-xl">
                    <Icon size={18} className="text-teal-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/25 border border-white/10 px-2 py-0.5 rounded-full">{tag}</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base leading-tight">{name}</h4>
                  <p className="text-teal-500/70 text-xs font-medium mt-0.5">{hindi}</p>
                </div>
                <p className="text-white/40 text-sm leading-relaxed flex-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to get started?</h3>
          <p className="text-white/40 text-base max-w-md mx-auto mb-8">
            Access your full operations dashboard — manage parties, products, visits and orders in one place.
          </p>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 bg-teal-500 hover:bg-teal-400 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-teal-500/25 hover:shadow-teal-400/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            Open Dashboard
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30">
                <span className="text-teal-400 font-black text-sm">M</span>
              </div>
              <div>
                <p className="font-bold text-white/80 text-sm">MedTrust Healthcare</p>
                <p className="text-white/30 text-xs">MEDTRUST HEALTH CARE · Proprietorship</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-white/25">
              <span>GST: 29EYSPS5133L1ZF</span>
              <span className="hidden sm:block">·</span>
              <span>Udyam: UDYAM-KR-03-0706248</span>
              <span className="hidden sm:block">·</span>
              <Link href="/company" className="hover:text-teal-400 transition-colors">Company Info</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20">
            <p>&copy; {new Date().getFullYear()} MedTrust Healthcare. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <BadgeCheck size={12} className="text-teal-500/60" />
              <p>Registered under GST &amp; MSME, Government of India</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

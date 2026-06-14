import { Building2, ShieldCheck, Award, Package, BadgeCheck, Layers } from "lucide-react";

function Badge({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`font-mono font-bold text-sm tracking-wide ${accent ? "text-teal-700" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="bg-teal-50 p-1.5 rounded-lg">
          <Icon size={15} className="text-teal-600" />
        </div>
        <h2 className="font-semibold text-sm text-slate-700 tracking-tight">{title}</h2>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Hero */}
      <div className="bg-[#0c1220] rounded-2xl px-6 py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.12),_transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500 shadow-lg shadow-teal-500/30">
              <span className="text-white font-black text-base tracking-tight">M</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight leading-none">MedTrust Healthcare</p>
              <p className="text-white/40 text-xs mt-0.5 font-medium tracking-wide">MEDTRUST HEALTH CARE</p>
              <p className="text-white/25 text-[10px] font-semibold tracking-[0.1em] mt-0.5">Reliable · Rapid · Cost-Optimal</p>
            </div>
          </div>

          <p className="text-white/60 text-sm max-w-lg leading-relaxed mb-6">
            Retail distribution of pharmaceutical, medical and orthopaedic goods. Supplying hospitals, clinics and healthcare agencies worldwide.
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "GST Registered", color: "bg-teal-500/15 text-teal-300 border-teal-500/20" },
              { label: "MSME · Micro Enterprise", color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20" },
              { label: "Udyam Certified", color: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
              { label: "Active · Since June 2026", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
            ].map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border ${b.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Registration numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Badge label="GST Registration Number" value="29EYSPS5133L1ZF" accent />
        <Badge label="Udyam Registration Number" value="UDYAM-KR-03-0706248" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Details */}
        <Section title="Business Details" icon={Building2}>
          <InfoRow label="Legal Trade Name" value="MEDTRUST HEALTH CARE" />
          <InfoRow label="Constitution" value="Proprietorship" />
          <InfoRow label="Enterprise Type" value="Micro Enterprise" />
          <InfoRow label="Type of Organisation" value="Proprietary" />
          <InfoRow label="Major Activity" value="Trading" />
          <InfoRow label="Type of Registration" value="Regular" />
          <InfoRow label="Social Category" value="General" />
        </Section>

        {/* Compliance */}
        <Section title="Compliance & Certifications" icon={ShieldCheck}>
          <InfoRow label="GST Registration" value="29EYSPS5133L1ZF" />
          <InfoRow label="MSME / Udyam" value="UDYAM-KR-03-0706248" />
          <InfoRow label="MSME Classification Year" value="2026–27" />
          <InfoRow label="Enterprise Category" value="Micro" />
          <InfoRow label="GST Status" value="Active" />
        </Section>
      </div>

      {/* NIC / Industry Classification */}
      <Section title="National Industry Classification" icon={Layers}>
        <div className="py-3 space-y-3">
          {[
            {
              nic: "47721",
              desc: "Retail sale of pharmaceuticals, medical and orthopaedic goods and toilet articles in specialised stores",
              activity: "Trading",
            },
            {
              nic: "47722",
              desc: "Retail sale of perfumery and cosmetic articles in specialised stores",
              activity: "Trading",
            },
          ].map((row) => (
            <div key={row.nic} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="bg-teal-100 text-teal-700 font-mono font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 mt-0.5">
                {row.nic}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{row.desc}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 shrink-0 mt-0.5 pt-0.5">{row.activity}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Product scope */}
      <Section title="Product Scope" icon={Package}>
        <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Pharmaceuticals", desc: "Medicines, supplements and drug products for clinical use" },
            { label: "Medical & Orthopaedic", desc: "Surgical supplies, orthopaedic equipment and diagnostic items" },
            { label: "Healthcare Consumables", desc: "Toilet articles, cosmetic and personal care products" },
          ].map((p) => (
            <div key={p.label} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50">
              <p className="text-xs font-semibold text-teal-700 mb-1">{p.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Legal footer */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <BadgeCheck size={16} className="text-teal-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Legal Disclosures</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              MEDTRUST HEALTH CARE is a registered proprietorship firm under the Goods &amp; Services Tax Act (GST No. 29EYSPS5133L1ZF) and recognised as a Micro Enterprise under the Ministry of Micro, Small &amp; Medium Enterprises, Government of India (Udyam No. UDYAM-KR-03-0706248). All registrations are valid and active as of the date of issue.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              &copy; {new Date().getFullYear()} MedTrust Healthcare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

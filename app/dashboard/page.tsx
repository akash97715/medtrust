"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getDashboardProfit, getTopProducts, getDailyActivity, getProductLeaders } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Users, Package, CalendarCheck, ShoppingCart, Building2, Briefcase, TrendingUp, ArrowUpRight, Lock, IndianRupee } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PinInput } from "@/components/pin-input";

function ProfitCard({ isLoading }: { isLoading: boolean }) {
  const { data } = useQuery({ queryKey: ["profit"], queryFn: getDashboardProfit, enabled: true });
  const p = data as { total_profit: number; order_count: number; total_collected: number; total_outstanding: number } | undefined;
  const { tryUnlock } = useAuth();

  const [entering, setEntering] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPin, setResetPin] = useState(0);

  const handleComplete = async (pin: string) => {
    setLoading(true);
    setError(false);
    const ok = await tryUnlock(pin);
    setLoading(false);
    if (ok) { setUnlocked(true); setEntering(false); }
    else { setError(true); setResetPin((v) => v + 1); }
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white p-5 min-h-[110px] flex flex-col justify-between">
      {/* decorative circles */}
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1">
          <IndianRupee size={12} className="text-emerald-100" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Profit & Collections</p>
        </div>
        <p className="text-[10px] text-emerald-200 mb-3">Proportional profit from all payments</p>

        {isLoading ? (
          <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
        ) : unlocked ? (
          <div>
            <div className="flex items-end gap-2 mb-3">
              <p className="text-3xl font-black tracking-tight">{money(p?.total_profit ?? 0)}</p>
              <button onClick={() => { setUnlocked(false); setEntering(false); }} className="mb-1 text-emerald-200 hover:text-white transition-colors">
                <Lock size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wide">Collected</p>
                <p className="text-sm font-black mt-0.5">{money(p?.total_collected ?? 0)}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wide">Outstanding</p>
                <p className="text-sm font-black mt-0.5">{money(p?.total_outstanding ?? 0)}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-200 mt-2">{p?.order_count ?? 0} order{(p?.order_count ?? 0) !== 1 ? "s" : ""} with payments</p>
          </div>
        ) : entering ? (
          <div className="space-y-3">
            <PinInput dark onComplete={handleComplete} loading={loading} reset={resetPin} />
            {loading && <p className="text-xs text-white/50 text-center">Verifying…</p>}
            {error && <p className="text-xs text-red-300 font-medium text-center">Incorrect code. Try again.</p>}
            <button
              onClick={() => { setEntering(false); setError(false); }}
              className="w-full text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => { setEntering(true); setError(false); setResetPin((v) => v + 1); }} className="flex items-center gap-3 group w-full text-left">
            <div className="bg-white/20 group-hover:bg-white/30 rounded-full p-2.5 transition-all group-hover:scale-110">
              <Lock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-white/30 tracking-widest select-none">₹ ·····</p>
              <p className="text-[11px] text-emerald-200 group-hover:text-white transition-colors mt-0.5">Click to unlock with employee code</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, insight, href }: { label: string; value: unknown; icon: React.ElementType; insight?: string; href: string }) {
  return (
    <Link href={href} className="block group">
      <Card className="transition-all duration-150 hover:border-teal-200 hover:shadow-md group-hover:bg-slate-50/50">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold mt-1 text-slate-800">{String(value ?? "—")}</p>
              {insight && <p className="text-xs text-teal-600 font-medium mt-1">{insight}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 ml-3">
              <div className="bg-teal-50 p-2.5 rounded-lg group-hover:bg-teal-100 transition-colors">
                <Icon size={18} className="text-teal-600" />
              </div>
              <ArrowUpRight size={13} className="text-slate-300 group-hover:text-teal-400 transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: summary, isLoading: ls } = useQuery({ queryKey: ["summary"], queryFn: getDashboardSummary });
  const { isLoading: lp2 } = useQuery({ queryKey: ["profit"], queryFn: getDashboardProfit });
  const { data: topProducts, isLoading: ltp } = useQuery({ queryKey: ["top-products"], queryFn: getTopProducts });
  const { data: daily, isLoading: ld } = useQuery({ queryKey: ["daily"], queryFn: getDailyActivity });
  const { data: leaders } = useQuery({ queryKey: ["leaders"], queryFn: getProductLeaders });

  const s = summary as Record<string, number> | undefined;
  const dailyData = daily ? [...(daily as Record<string, unknown>[])].reverse() : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Operations overview</p>
      </div>

      {/* System overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "🏥", title: "Parties — पार्टियाँ", desc: "Hospitals, agencies and clinics you visit and supply to. Each party has a full profile with visit history, demand, and order records.", href: "/parties" },
          { icon: "💊", title: "Products — उत्पाद", desc: "Surgical and medical items master list. Add each product once; reuse it across visits and orders. Track demand vs actual orders.", href: "/products" },
          { icon: "📋", title: "Visits & Orders — विज़िट और ऑर्डर", desc: "Log every field visit with what was needed. Convert demand to confirmed orders with buy/sell rates. Pricing auto-updates on each order.", href: "/visits" },
        ].map((c) => (
          <Link key={c.title} href={c.href} className="group bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-150 block">
            <p className="text-xl mb-1">{c.icon}</p>
            <p className="font-semibold text-sm text-slate-700 mb-1 group-hover:text-teal-700 transition-colors">{c.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ls ? Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (<>
          <StatCard
            label="Total Parties"
            value={s?.total_parties}
            icon={Users}
            href="/parties"
            insight={s ? `${s.total_hospitals} hospitals · ${s.total_agencies} agencies` : undefined}
          />
          <StatCard
            label="Hospitals"
            value={s?.total_hospitals}
            icon={Building2}
            href="/parties"
            insight={s?.total_parties ? `${Math.round((s.total_hospitals / s.total_parties) * 100)}% of all parties` : undefined}
          />
          <StatCard
            label="Agencies"
            value={s?.total_agencies}
            icon={Briefcase}
            href="/parties"
            insight={s?.total_parties ? `${Math.round((s.total_agencies / s.total_parties) * 100)}% of all parties` : undefined}
          />
          <StatCard
            label="Products"
            value={s?.total_products}
            icon={Package}
            href="/products"
            insight="items in surgical catalog"
          />
          <StatCard
            label="Visits"
            value={s?.total_visits}
            icon={CalendarCheck}
            href="/visits"
            insight="field visits logged"
          />
          <StatCard
            label="Confirmed Orders"
            value={s?.total_orders}
            icon={ShoppingCart}
            href="/orders"
            insight={s?.total_orders && s.total_parties ? `across ${s.total_parties} parties` : "confirmed line items"}
          />
          <StatCard
            label="Confirmed Value"
            value={money(s?.total_order_value)}
            icon={TrendingUp}
            href="/orders"
            insight={s?.total_orders && s.total_orders > 0 ? `avg ${money(Math.round((s.total_order_value ?? 0) / s.total_orders))} per order` : "sell rate basis"}
          />
          <ProfitCard isLoading={lp2} />
        </>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Activity — Visits & Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ld ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={dailyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="activity_date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visits_count" stroke="#0d9488" name="Visits" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="orders_count" stroke="#6366f1" name="Orders" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Products by Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            {ltp ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={(topProducts as Record<string, unknown>[] ?? []).slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 70, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(v) => money(v as number)} />
                  <Bar dataKey="ordered_value" fill="#0d9488" name="Order Value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Product Leaders — Top Buyer per Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-slate-500 text-left">
                  <th className="pb-2 pr-4 font-medium">Product</th>
                  <th className="pb-2 pr-4 font-medium">Leading Buyer</th>
                  <th className="pb-2 pr-4 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Sales Value</th>
                </tr>
              </thead>
              <tbody>
                {(leaders as Record<string, unknown>[] ?? []).map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-4 font-medium">{fmt(r.product_name)}</td>
                    <td className="py-2 pr-4 text-slate-600">{fmt(r.leading_buyer_name)}</td>
                    <td className="py-2 pr-4 text-right">{fmt(r.total_quantity)}</td>
                    <td className="py-2 text-right font-medium text-teal-700">{money(r.total_sales_value as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

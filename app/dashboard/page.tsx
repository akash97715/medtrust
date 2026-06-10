"use client";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getTopProducts, getDailyActivity, getProductLeaders } from "@/lib/api";
import { money, fmt } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { Users, Package, CalendarCheck, ShoppingCart, Building2, Briefcase, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

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
  const { data: topProducts, isLoading: lp } = useQuery({ queryKey: ["top-products"], queryFn: getTopProducts });
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
            {lp ? <Skeleton className="h-52" /> : (
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

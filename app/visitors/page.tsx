"use client";
import { useQuery } from "@tanstack/react-query";
import { getEnquiries } from "@/lib/api";
import Link from "next/link";
import { Phone, Package, Clock, ExternalLink, Users } from "lucide-react";

type Enquiry = {
  id: string;
  product_id: string;
  product_name: string;
  visitor_phone: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VisitorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: getEnquiries,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const enquiries = (data as Enquiry[] ?? []);
  const withPhone = enquiries.filter((e) => e.visitor_phone);
  const withoutPhone = enquiries.filter((e) => !e.visitor_phone);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Product Enquiries</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Visitors who clicked &quot;Get Best Price&quot; on the catalog
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium mb-1">Total Enquiries</p>
          <p className="text-3xl font-black text-slate-800">{enquiries.length}</p>
        </div>
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
          <p className="text-xs text-teal-600 font-medium mb-1">Left Phone No.</p>
          <p className="text-3xl font-black text-teal-700">{withPhone.length}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium mb-1">Anonymous</p>
          <p className="text-3xl font-black text-slate-600">{withoutPhone.length}</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl">
          <Users size={44} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 font-semibold">No enquiries yet</p>
          <p className="text-slate-300 text-sm mt-1">
            When visitors click &quot;Get Best Price&quot; on a catalog product, they appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e, idx) => (
            <div
              key={e.id}
              className="flex items-start gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Index */}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-400">
                {idx + 1}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Phone */}
                <div className="flex items-center gap-2">
                  <Phone size={13} className={e.visitor_phone ? "text-teal-500" : "text-slate-300"} />
                  {e.visitor_phone ? (
                    <a
                      href={`tel:${e.visitor_phone}`}
                      className="text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors"
                    >
                      +91 {e.visitor_phone}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 italic">No phone provided</span>
                  )}
                </div>

                {/* Product */}
                <div className="flex items-start gap-2">
                  <Package size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <Link
                    href={`/catalog/${e.product_id}`}
                    className="text-sm text-slate-600 hover:text-teal-700 font-medium leading-snug flex items-center gap-1 group transition-colors"
                  >
                    <span className="line-clamp-1">{e.product_name}</span>
                    <ExternalLink size={11} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={11} />
                  <span title={formatDate(e.created_at)}>{timeAgo(e.created_at)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{formatDate(e.created_at)}</span>
                </div>
              </div>

              {/* Call CTA */}
              {e.visitor_phone && (
                <a
                  href={`tel:${e.visitor_phone}`}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  <Phone size={12} /> Call
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

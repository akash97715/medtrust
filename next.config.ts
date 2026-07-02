import type { NextConfig } from "next";

const RAILWAY_URL = "https://medtrust-production.up.railway.app";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
  async rewrites() {
    // Proxy all /api/* through Vercel → Railway server-side.
    // Browsers only talk to www.medtrust.space — corporate firewalls that block
    // *.railway.app directly will no longer affect API calls.
    if (process.env.NODE_ENV === "development") return [];
    return [
      {
        source: "/api/:path*",
        destination: `${RAILWAY_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

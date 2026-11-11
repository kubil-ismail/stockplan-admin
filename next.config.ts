import type { NextConfig } from "next";

// Backend origin (Express). Browser calls /admin/api/* on this app's origin; Next forwards it so the backend's
// httpOnly `asid` cookie (path /admin/api) works without CORS.
const ADMIN_API_ORIGIN = process.env.ADMIN_API_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [{ source: "/admin/api/:path*", destination: `${ADMIN_API_ORIGIN}/admin/api/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

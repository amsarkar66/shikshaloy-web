import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Hashed build assets under /_next/static are already served
        // immutable by Next.js and can't be overridden here, so this only
        // affects HTML documents and other non-hashed responses. Forces
        // browsers to revalidate with the server instead of rendering a
        // stale page that references CSS/JS files removed by a later deploy.
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;

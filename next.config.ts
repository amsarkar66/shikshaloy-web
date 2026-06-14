import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trust Hostinger's reverse proxy to forward the real protocol/host
  experimental: {
    trustHostHeader: true,
  },
};

export default nextConfig;

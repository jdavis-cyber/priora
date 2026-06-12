import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "26mb", // 25 MB evidence limit + multipart overhead
    },
  },
};

export default nextConfig;

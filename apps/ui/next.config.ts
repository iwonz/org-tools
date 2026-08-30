import type { NextConfig } from "next";

const nextConfig = {
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@org-tools/types"],
} satisfies NextConfig;

export default nextConfig;

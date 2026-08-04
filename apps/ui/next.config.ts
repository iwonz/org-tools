import type { NextConfig } from "next";

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@org-tools/types"],
} satisfies NextConfig;

export default nextConfig;

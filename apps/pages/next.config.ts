import type { NextConfig } from "next";

const nextConfig = {
  assetPrefix: "/org-tools",
  basePath: "/org-tools",
  images: {
    unoptimized: true,
  },
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@org-tools/types"],
} satisfies NextConfig;

export default nextConfig;

import type { NextConfig } from "next";

const distDir = process.env.ORG_TOOLS_NEXT_DIST_DIR?.trim() || ".next";

const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "app"],
  devIndicators: false,
  distDir,
  images: {
    unoptimized: true,
  },
  output: "standalone",
  serverExternalPackages: ["pg"],
  transpilePackages: ["@org-tools/types"],
  webpack(config, { webpack }) {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/.org-tools/**", "**/.playwright-cli/**"],
    };
    config.plugins.push(
      new webpack.WatchIgnorePlugin({
        paths: [/(^|[/\\])\.(?:org-tools|playwright-cli)([/\\]|$)/u],
      }),
    );
    return config;
  },
} satisfies NextConfig;

export default nextConfig;

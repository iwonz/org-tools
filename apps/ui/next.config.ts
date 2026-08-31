import type { NextConfig } from "next";

const distDir = process.env.ORG_TOOLS_NEXT_DIST_DIR?.trim() || ".next";

const nextConfig = {
  distDir,
  images: {
    unoptimized: true,
  },
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

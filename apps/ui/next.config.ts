import type { NextConfig } from "next";

const nextConfig = {
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

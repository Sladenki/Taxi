import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["maplibre-gl", "pmtiles"],
  agentRules: false,
};

export default nextConfig;

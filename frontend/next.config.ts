import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone with a minimal server.js + traced node_modules,
  // so the production Docker image doesn't need the full node_modules tree.
  output: "standalone",
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build prod autonome (image runner légère : node server.js).
  output: "standalone",
};

export default nextConfig;

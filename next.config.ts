import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // A package-lock.json in the user's home folder confuses root detection.
  turbopack: { root: __dirname },
};

export default nextConfig;

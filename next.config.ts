import type { NextConfig } from "next";

/**
 * Two builds from one codebase:
 * - Normal (npm run dev / build / start): a Node server, with the /api/contact handler.
 * - GitHub Pages (GITHUB_PAGES=true, set by .github/workflows/pages.yml): static files
 *   under the repo's sub-path. Pages can't run server code, so route handlers are left
 *   out by only treating .tsx files as pages, and the form falls back to WhatsApp.
 */
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "") : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // A package-lock.json in the user's home folder confuses root detection.
  turbopack: { root: __dirname },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC: pages ? "true" : "",
  },
  ...(pages
    ? {
        output: "export" as const,
        basePath,
        // solutions/index.html rather than solutions.html: Pages would otherwise answer
        // /solutions from the solutions/ folder (it holds that page's social image) with a 404.
        trailingSlash: true,
        pageExtensions: ["tsx"],
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;

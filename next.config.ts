import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.REPO_NAME ?? "";

const nextConfig: NextConfig = {
  // ── Static export for GitHub Pages ───────────────────────────
  ...(isGithubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath: repoName ? `/${repoName}` : "",
        assetPrefix: repoName ? `/${repoName}/` : "",
      }
    : {}),

  // ── Image domains ─────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Static export requires unoptimized images
    unoptimized: true,
  },

  // ── Turbopack CSS (dev) ───────────────────────────────────────
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

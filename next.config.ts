import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { INDEXING_ENABLED } from "./lib/site";

/**
 * Strony robocze (/dev/*) mają pliki `page.dev.tsx` / `layout.dev.tsx`.
 * Rozszerzenie `dev.tsx` jest rejestrowane tylko w `next dev`, więc w buildzie
 * produkcyjnym te trasy nie istnieją (404) i nic z nich nie trafia do paczki.
 */
const DEV_PAGE_EXTENSIONS = ["dev.tsx", "dev.ts"];
const PAGE_EXTENSIONS = ["tsx", "ts", "jsx", "js"];

export default function nextConfig(phase: string): NextConfig {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    cacheComponents: true,
    partialPrefetching: true,
    agentRules: false,
    poweredByHeader: false,
    pageExtensions: isDevServer ? [...DEV_PAGE_EXTENSIONS, ...PAGE_EXTENSIONS] : PAGE_EXTENSIONS,
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
    async headers() {
      const security = [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ];
      const robots = INDEXING_ENABLED
        ? []
        : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
      return [{ source: "/:path*", headers: [...security, ...robots] }];
    },
  };
}

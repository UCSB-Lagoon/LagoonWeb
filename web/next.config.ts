import type { NextConfig } from "next";
import { PENDING_SLUGS, HOME_MIGRATED } from "./lib/marketing-slugs";

/**
 * Guides are MDX compiled at build time via next-mdx-remote/rsc (no
 * webpack/turbopack loader — the dev script uses --turbopack and the
 * @next/mdx loader isn't turbopack-serializable), so no MDX config here.
 */
const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/admin/handbook": ["./content/onboarding.md"],
    // Guide MDX is read from disk at build time — keep it in the trace.
    "/[slug]": ["./content/guides/**/*"],
    "/": ["./content/home-body.html", "./content/home.jsonld.json"],
    "/guides": ["./content/guides-body.html", "./content/guides.jsonld.json"],
    "/company": ["./content/company-body.html", "./content/company.jsonld.json"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lagoonucsb.com" },
    ],
  },
  async rewrites() {
    return [
      ...(HOME_MIGRATED
        ? []
        : [{ source: "/", destination: "/marketing/home.html" }]),
      ...PENDING_SLUGS.map((slug) => ({
        source: `/${slug}`,
        destination: `/marketing/${slug}.html`,
      })),
    ];
  },
};

export default config;

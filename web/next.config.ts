import type { NextConfig } from "next";

/**
 * Guides are MDX compiled at build time via next-mdx-remote/rsc (no
 * webpack/turbopack loader — the dev script uses --turbopack and the
 * @next/mdx loader isn't turbopack-serializable), so no MDX config here.
 *
 * The old static-marketing rewrites are gone: every marketing URL is now
 * a real Next route under app/(marketing)/. The content/ files (guide
 * MDX, ported home/guides/company body + JSON-LD) are read from disk at
 * build time, so they must stay in the output file trace.
 */
const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/admin/handbook": ["./content/onboarding.md"],
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
};

export default config;

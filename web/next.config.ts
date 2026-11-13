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
    "/courses": ["./data/course-grades.json.gz"],
    "/courses/*": ["./data/course-grades.json.gz"],
    "/admin/handbook": ["./content/onboarding.md"],
    "/[slug]": ["./content/guides/**/*"],
    "/": ["./content/home-body.html", "./content/home.jsonld.json"],
    // /guides also reads every guide's frontmatter for its ItemList JSON-LD.
    "/guides": [
      "./content/guides-body.html",
      "./content/guides.jsonld.json",
      "./content/guides/**/*",
    ],
    "/sitemap.xml": ["./content/guides/**/*"],
    "/company": ["./content/company-body.html", "./content/company.jsonld.json"],
  },
  // Filtered course views (?instructor= / ?quarter=) are the same static page
  // filtered in the browser, so the page can't emit a per-URL noindex meta.
  // Mark them noindex at the edge instead: no function runs for this.
  async headers() {
    return ["instructor", "quarter"].map((key) => ({
      source: "/courses/:slug",
      has: [{ type: "query" as const, key }],
      headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
    }));
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lagoonucsb.com" },
    ],
  },
};

export default config;

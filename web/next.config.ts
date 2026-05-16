import type { NextConfig } from "next";
import { MARKETING_SLUGS } from "./lib/marketing-slugs";

const config: NextConfig = {
  reactStrictMode: true,
  // Ensure the handbook markdown is bundled into the /admin/handbook lambda.
  outputFileTracingIncludes: {
    "/admin/handbook": ["./content/onboarding.md"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lagoonucsb.com" },
    ],
  },
  async rewrites() {
    return [
      // Root → marketing homepage (hand-crafted HTML). The Next.js dashboard
      // moved to /hub.
      { source: "/", destination: "/marketing/home.html" },
      // Each marketing slug → its static HTML in public/marketing/.
      ...MARKETING_SLUGS.map((slug) => ({
        source: `/${slug}`,
        destination: `/marketing/${slug}.html`,
      })),
    ];
  },
};

export default config;

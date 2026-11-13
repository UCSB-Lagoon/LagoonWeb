import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Static files, sitemaps, robots, the manifest and the course pages need no
// session. /courses is ~10k crawler-heavy static pages; skipping it here keeps
// every crawl of them from invoking middleware at all.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|courses|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif|woff2?|ttf|txt|xml|json|webmanifest|css|js|map)$).*)",
  ],
};

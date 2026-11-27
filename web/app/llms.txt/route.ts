import { buildLlmsTxt } from "@/lib/llms";

// Built once at build time from the guides and the grade snapshot; see lib/llms.ts.
export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

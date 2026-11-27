import { buildLlmsFullTxt } from "@/lib/llms";

// Built once at build time: llms.txt plus every guide's text. See lib/llms.ts.
export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

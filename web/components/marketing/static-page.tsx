import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GuideJsonLd } from "@/components/seo/guide-jsonld";

/**
 * Renders a ported structure page (/guides, /company): captured JSON-LD
 * verbatim + the original body as trusted first-party markup, styled by
 * site.css (loaded by the marketing layout). Chrome comes from the
 * layout. Pixel-faithful to the static original.
 */
export async function StaticMarketingPage({ slug }: { slug: string }) {
  const dir = join(process.cwd(), "content");
  const [body, blocks] = await Promise.all([
    readFile(join(dir, `${slug}-body.html`), "utf8"),
    readFile(join(dir, `${slug}.jsonld.json`), "utf8").then(
      (s) => JSON.parse(s) as unknown[]
    ),
  ]);
  return (
    <>
      <GuideJsonLd blocks={blocks} />
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}

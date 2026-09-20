import { notFound } from "next/navigation";
import { CONCEPTS, findConcept } from "../concepts";
import { ProofConcept } from "./concepts/proof";
import { DirectoryConcept } from "./concepts/directory";

export const revalidate = 120;

/** Pre-render the registry so a typo in a slug fails at build, not in review. */
export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ concept: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  const c = findConcept(concept);
  return { title: c ? c.name : "Unknown concept" };
}

/**
 * Slug → component, explicitly. A dynamic import keyed on the URL segment
 * would be shorter and would also let any string reach the filesystem; the
 * registry is small enough that being boring here is free.
 */
const RENDERERS: Record<string, () => Promise<React.ReactElement>> = {
  proof: ProofConcept,
  directory: DirectoryConcept,
};

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  const meta = findConcept(concept);
  const render = RENDERERS[concept];
  if (!meta || !render) notFound();

  return (
    <>
      {/* The thesis travels with the concept. A design review that has
          forgotten what the design was arguing becomes a review of taste. */}
      <div className="border-b border-cream-200 bg-cream-100/60">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
            Concept · {meta.name}
          </p>
          <p className="text-sm text-ink-700 mt-1.5 max-w-3xl leading-relaxed">{meta.thesis}</p>
        </div>
      </div>
      {await render()}
    </>
  );
}

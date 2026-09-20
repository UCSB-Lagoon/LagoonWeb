/**
 * The concept registry.
 *
 * Adding a direction is one entry here plus one component under
 * `app/(lab)/lab/[concept]/concepts/`. Keeping them in a list rather than
 * relying on the filesystem means the index page can say what each one is
 * actually arguing, which is the part worth reviewing — a concept is a claim
 * about what the page is for, not a colour scheme.
 */
export type Concept = {
  slug: string;
  name: string;
  /** The claim. One sentence, in the form "the site should …". */
  thesis: string;
  /** What it would cost to adopt, honestly. */
  cost: string;
};

export const CONCEPTS: Concept[] = [
  {
    slug: "proof",
    name: "Proof first",
    thesis:
      "Lead with the live database instead of a phone mockup — at week 0 the most persuasive thing Lagoon has is that its numbers are real and small.",
    cost: "Low. Reuses the existing stats queries and card primitives; mostly a homepage reorder.",
  },
  {
    slug: "directory",
    name: "Course directory",
    thesis:
      "Treat the site as a UCSB course-and-dining reference that happens to have an app, so it earns search traffic on its own instead of relying on the app for distribution.",
    cost: "High. Needs real per-course pages and a content pipeline, but it is the only concept here that compounds without downloads.",
  },
];

export function findConcept(slug: string) {
  return CONCEPTS.find((c) => c.slug === slug);
}

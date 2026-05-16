import type { ReactNode } from "react";
import type { GuideFrontmatter } from "@/components/seo/guide-jsonld";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

/**
 * Shared chrome for every guide page (page-hero + article wrapper +
 * related-guides). All guides share this exactly; the MDX file only
 * carries the article prose. Markup mirrors the old static guides so
 * site.css styles it unchanged.
 */
export function GuideShell({
  fm,
  children,
}: {
  fm: GuideFrontmatter;
  children: ReactNode;
}) {
  return (
    <>
      <section className="page-hero">
        <div className="article-shell">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/guides">Guides</a>
            <span>/</span>
            <span>{fm.breadcrumbName}</span>
          </div>
          <p className="eyebrow">{fm.eyebrow}</p>
          <h1>{fm.h1}</h1>
          <p className="updated-stamp">{fm.updatedStamp}</p>
          <p>{fm.intro}</p>
          <div className="article-meta">
            {fm.metaPills.map((p) => (
              <span className="meta-pill" key={p}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <article className="article-shell article-card">{children}</article>
      </section>

      <section className="related-guides" aria-labelledby="related-guides-title">
        <h2 id="related-guides-title">Related guides</h2>
        <ul className="related-guides-list">
          {fm.related.map((r) => (
            <li key={r.href}>
              <a href={r.href}>{r.label}</a>
            </li>
          ))}
        </ul>
        <p className="related-guides-cta">
          {fm.relatedCtaText}{" "}
          <a href={APP_STORE} rel="noreferrer" data-lagoon-cta="related-guides">
            Get Lagoon free →
          </a>
        </p>
      </section>
    </>
  );
}

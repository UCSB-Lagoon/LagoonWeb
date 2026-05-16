import type { ReactNode } from "react";

/** Callout box used in guide bodies. */
export function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="callout">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

/** The pill-link row at the bottom of a guide. */
export function ArticleLinks({ children }: { children: ReactNode }) {
  return <div className="article-links">{children}</div>;
}

/** FAQ accordion (matches the old static .faq-list markup). */
export function FaqList({ children }: { children: ReactNode }) {
  return <div className="faq-list">{children}</div>;
}

export function FaqItem({
  q,
  open,
  children,
}: {
  q: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open}>
      <summary>{q}</summary>
      {children}
    </details>
  );
}

/** Components made available to every guide MDX file. */
export const mdxComponents = { Callout, ArticleLinks, FaqList, FaqItem };

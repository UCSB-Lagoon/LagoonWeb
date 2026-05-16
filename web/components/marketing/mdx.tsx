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

/** Components made available to every guide MDX file. */
export const mdxComponents = { Callout, ArticleLinks };

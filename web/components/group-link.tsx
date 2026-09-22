"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { crossesRouteGroup } from "@/lib/routes";

type GroupLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * A link that degrades to a full page load when it leaves the route group.
 *
 * Soft-navigating between (marketing) and (app) keeps the previous group's
 * GA4 `config` alive in the same document, because GA4 has no way to
 * un-configure a stream — see components/site-analytics.tsx. A plain <a>
 * gives us a new document, and therefore exactly one live stream.
 *
 * Within a group this is an ordinary next/link, so the campus sub-nav and
 * the guides stay as fast as they were.
 */
export function GroupLink({ href, children, ...rest }: GroupLinkProps) {
  const pathname = usePathname();
  if (crossesRouteGroup(pathname, href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

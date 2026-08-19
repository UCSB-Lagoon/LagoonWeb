"use client";

import { useEffect } from "react";

/**
 * The homepage's scroll-reveal: an IntersectionObserver that adds `.on`
 * to the below-the-fold .r/.rl/.rr elements as they come into view.
 *
 * The hero is deliberately NOT handled here — it uses the CSS-only
 * .hr/.hrr entrance so the <h1> (the LCP element) paints without waiting
 * for this bundle. The hidden state for .r/.rl/.rr is itself gated on
 * `html.js`, so if this never runs the page still reads fine.
 */
export function HomeClient() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".r,.rl,.rr");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("on"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -24px 0px" }
    );
    targets.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}

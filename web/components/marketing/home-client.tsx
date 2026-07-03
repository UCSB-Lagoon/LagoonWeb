"use client";

import { useEffect } from "react";

/**
 * The homepage's inline behaviour, verbatim from the static original:
 *  - scroll-reveal: IntersectionObserver adds `.on` to .r/.rl/.rr
 *    (hero ones revealed immediately so there's no first-paint gap)
 * (Announce-bar dismiss is the shared <AnnounceBar/>; lagoon-cta.js is
 * loaded by the marketing layout. The old [data-live] counter fetch is
 * gone with the fabricated stats floor — public numbers live on /stats.)
 */
export function HomeClient() {
  useEffect(() => {
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
    document.querySelectorAll(".r,.rl,.rr").forEach((el) => io.observe(el));
    document
      .querySelectorAll("#hero .r, #hero .rl, #hero .rr")
      .forEach((el) => el.classList.add("on"));

    return () => io.disconnect();
  }, []);

  return null;
}

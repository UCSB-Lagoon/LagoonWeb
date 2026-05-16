"use client";

import { useEffect } from "react";

/**
 * The homepage's two original inline behaviours, verbatim:
 *  - scroll-reveal: IntersectionObserver adds `.on` to .r/.rl/.rr
 *    (hero ones revealed immediately so there's no first-paint gap)
 *  - live data: fills [data-live] from /api/public/stats, silent fallback
 * (Announce-bar dismiss is the shared <AnnounceBar/>; lagoon-cta.js is
 * loaded by the marketing layout.)
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

    const targets = document.querySelectorAll("[data-live]");
    if (targets.length) {
      const fmt = (n: number | null) => {
        if (n == null || isNaN(n)) return "—";
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
        if (n >= 10_000) return (n / 1_000).toFixed(0) + "k";
        if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
        return Number(n).toLocaleString();
      };
      fetch("/api/public/stats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          const map: Record<string, string> = {
            users: fmt(d.total_users),
            active: fmt(d.active_users_14d),
            xp: fmt(d.lifetime_xp),
            streak: d.top_streak != null ? d.top_streak + "d" : "—",
          };
          targets.forEach((el) => {
            const k = el.getAttribute("data-live");
            if (k && map[k]) el.textContent = map[k];
          });
          const u = document.querySelector("[data-live-updated]");
          if (u) u.textContent = "Live · refreshed just now";
        })
        .catch(() => {});
    }

    return () => io.disconnect();
  }, []);

  return null;
}

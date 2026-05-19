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
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const countUp = (el: Element, to: number, render: (n: number) => string) => {
        const dur = 1100;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = render(Math.round(to * easeOut(p)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };

      fetch("/api/public/stats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          const nums: Record<string, { to: number; render: (n: number) => string }> = {
            users: { to: d.total_users ?? 0, render: fmt },
            active: { to: d.active_users_14d ?? 0, render: fmt },
            xp: { to: d.lifetime_xp ?? 0, render: fmt },
            streak: { to: d.top_streak ?? 0, render: (n) => (n > 0 ? n + "d" : "—") },
          };
          targets.forEach((el) => {
            const k = el.getAttribute("data-live");
            const n = k ? nums[k] : null;
            if (!n) return;
            el.closest(".live-stat")?.classList.add("is-live");
            countUp(el, n.to, n.render);
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

"use client";

import dynamic from "next/dynamic";

export const CampusMap = dynamic(
  () => import("./campus-map").then((m) => m.CampusMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="relative w-full rounded-3xl overflow-hidden border border-cream-200 bg-cream-100 grid place-items-center text-ink-500 text-sm"
        style={{ height: "calc(100vh - 8rem)", minHeight: 560 }}
      >
        Loading map…
      </div>
    ),
  },
);

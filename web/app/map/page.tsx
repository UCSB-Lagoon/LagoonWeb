import { Map } from "lucide-react";

export const metadata = { title: "Campus map" };

export default function MapPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-kelp-400/10 text-kelp-400 ring-1 ring-kelp-400/15">
          <Map className="w-6 h-6" />
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em]">Campus map</h1>
      </header>
      <div className="glass rounded-[1.6rem] p-10 text-center text-mist/60 relative overflow-hidden">
        <div className="absolute inset-x-10 top-8 h-28 rounded-full bg-amber/10 blur-3xl" />
        <p className="text-lg">Live UCSB map with vibe overlay</p>
        <p className="text-sm text-mist/40 mt-2">
          Coming in Phase 2 — MapLibre + dining hall busy-ness, study spot openness, and
          live event pins.
        </p>
      </div>
    </div>
  );
}

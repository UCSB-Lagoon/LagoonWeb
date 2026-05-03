import { Map } from "lucide-react";

export const metadata = { title: "Campus map" };

export default function MapPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <Map className="w-7 h-7 text-kelp-400" />
        <h1 className="font-display text-3xl">Campus map</h1>
      </header>
      <div className="glass rounded-2xl p-10 text-center text-mist/60">
        <p className="text-lg">Live UCSB map with vibe overlay</p>
        <p className="text-sm text-mist/40 mt-2">
          Coming in Phase 2 — MapLibre + dining hall busy-ness, study spot openness, and
          live event pins.
        </p>
      </div>
    </div>
  );
}

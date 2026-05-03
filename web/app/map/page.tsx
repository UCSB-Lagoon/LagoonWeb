import { Map } from "lucide-react";

export const metadata = { title: "Campus map" };

export default function MapPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <header className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
          <Map className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Campus map</h1>
          <p className="text-sm text-ink-500 mt-0.5">Live UCSB overlay — coming Phase 2</p>
        </div>
      </header>
      <div className="card-tinted p-12 text-center">
        <p className="font-display text-2xl text-ink-900">Live UCSB map with vibe overlay</p>
        <p className="text-sm text-ink-500 mt-2 max-w-md mx-auto">
          MapLibre + dining hall busy-ness, study spot openness, and live event pins.
        </p>
      </div>
    </div>
  );
}

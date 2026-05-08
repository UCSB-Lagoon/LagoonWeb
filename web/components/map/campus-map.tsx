"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_CENTER,
  CATEGORY_META,
  searchBuildings,
  type CampusBuilding,
  type BuildingCategory,
} from "@/lib/campus-buildings";
import { Search, X, ExternalLink, Users } from "lucide-react";

type LiveLocation = {
  user_id: string | null;
  is_friend: boolean;
  is_self: boolean;
  latitude: number;
  longitude: number;
  status_emoji: string | null;
  status_text: string | null;
  updated_at: string;
};

type Props = {
  signedIn: boolean;
};

const CATEGORIES: BuildingCategory[] = ["academic", "dining", "recreation", "housing", "services", "landmark"];

function pinIcon(b: CampusBuilding) {
  const meta = CATEGORY_META[b.category];
  return L.divIcon({
    className: "lg-pin-wrap",
    html: `<button class="lg-pin" style="background:${meta.color}" title="${b.name} · ${b.code}"><span>${meta.emoji}</span></button>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function personIcon(p: LiveLocation) {
  if (p.is_friend) {
    return L.divIcon({
      className: "lg-person-wrap",
      html: `<div class="lg-person lg-person--friend">${p.status_emoji ?? ""}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }
  return L.divIcon({
    className: "lg-person-wrap",
    html: `<div class="lg-person lg-person--anon"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export function CampusMap({ signedIn }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buildingLayerRef = useRef<L.LayerGroup | null>(null);
  const peopleLayerRef = useRef<L.LayerGroup | null>(null);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<BuildingCategory | null>(null);
  const [selected, setSelected] = useState<CampusBuilding | null>(null);
  const [people, setPeople] = useState<LiveLocation[]>([]);
  const [peopleErr, setPeopleErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = query ? searchBuildings(query) : CAMPUS_BUILDINGS;
    if (activeCat) list = list.filter((b) => b.category === activeCat);
    return list;
  }, [query, activeCat]);

  // Init map.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      subdomains: "abcd",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    buildingLayerRef.current = L.layerGroup().addTo(map);
    peopleLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render building markers.
  useEffect(() => {
    const layer = buildingLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    filtered.forEach((b) => {
      const marker = L.marker([b.lat, b.lng], { icon: pinIcon(b), title: b.name });
      marker.on("click", () => {
        setSelected(b);
        mapRef.current?.flyTo([b.lat, b.lng], 18, { duration: 0.8 });
      });
      marker.addTo(layer);
    });
  }, [filtered]);

  // Fetch live people pins.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const sb = createClient();
        const { data, error } = await sb.rpc("get_visible_user_locations", { within_minutes: 30 });
        if (cancelled) return;
        if (error) {
          setPeopleErr(error.message);
          return;
        }
        setPeople((data ?? []) as LiveLocation[]);
        setPeopleErr(null);
      } catch (e) {
        if (!cancelled) setPeopleErr(e instanceof Error ? e.message : "Failed to load");
      }
    }
    load();
    timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [signedIn]);

  // Render people markers.
  useEffect(() => {
    const layer = peopleLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    people.forEach((p) => {
      if (p.is_self) return;
      L.marker([p.latitude, p.longitude], { icon: personIcon(p), interactive: false }).addTo(layer);
    });
  }, [people]);

  const friendCount = people.filter((p) => p.is_friend && !p.is_self).length;
  const anonCount = people.filter((p) => !p.is_friend && !p.is_self).length;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-cream-200 bg-cream-100"
      style={{ height: "calc(100vh - 8rem)", minHeight: 560 }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-[400]">
        <div className="card p-3 backdrop-blur-md bg-cream-50/95">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buildings, codes, dining halls…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-cream-200 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCat(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${activeCat === null ? "bg-orange-500 text-white border-orange-500" : "bg-white border-cream-200 text-ink-500 hover:border-orange-300"}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(activeCat === c ? null : c)}
                className={`text-xs px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${activeCat === c ? "text-white border-transparent" : "bg-white border-cream-200 text-ink-500 hover:border-orange-300"}`}
                style={activeCat === c ? { background: CATEGORY_META[c].color } : undefined}
              >
                <span>{CATEGORY_META[c].emoji}</span>
                <span className="capitalize">{CATEGORY_META[c].label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-ink-400">
            {filtered.length} of {CAMPUS_BUILDINGS.length} buildings
          </div>
        </div>
      </div>

      {signedIn && (
        <div className="absolute top-3 right-3 z-[400] hidden sm:block">
          <div className="card px-3.5 py-2.5 backdrop-blur-md bg-cream-50/95">
            <div className="flex items-center gap-2 text-xs">
              <span className="live-dot" aria-hidden="true" />
              <span className="font-semibold text-ink-900">Live</span>
              <span className="text-ink-500">·</span>
              <Users className="w-3.5 h-3.5 text-ink-400" />
              <span className="text-ink-700 tabular-nums">
                {friendCount} friend{friendCount === 1 ? "" : "s"} · {anonCount} on campus
              </span>
            </div>
            {peopleErr && <div className="mt-1 text-[11px] text-orange-700">{peopleErr}</div>}
          </div>
        </div>
      )}

      {!signedIn && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] max-w-sm w-[90%]">
          <div className="card p-4 backdrop-blur-md bg-cream-50/95 text-center">
            <p className="text-sm text-ink-900 font-semibold">Sign in to see who's on campus</p>
            <p className="mt-1 text-xs text-ink-500">
              Lagoon shows your friends as named pins and other Gauchos anonymously.
            </p>
            <a href="/login" className="btn-primary mt-3 inline-flex !py-1.5 !px-3 text-xs">
              Sign in
            </a>
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-[400]">
          <div className="card p-4 backdrop-blur-md bg-cream-50/95">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400 font-semibold">
                  <span>{CATEGORY_META[selected.category].emoji}</span>
                  <span>{CATEGORY_META[selected.category].label}</span>
                  <span>·</span>
                  <span className="font-mono">{selected.code}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-ink-900 mt-1 leading-tight">
                  {selected.name}
                </h3>
                {selected.aliases?.length ? (
                  <p className="mt-1 text-xs text-ink-500">Also: {selected.aliases.join(" · ")}</p>
                ) : null}
                <a
                  href={`https://maps.apple.com/?q=${encodeURIComponent(selected.name + " UCSB")}&ll=${selected.lat},${selected.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Open in Apple Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 hover:bg-cream-100 text-ink-400"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .lg-pin-wrap, .lg-person-wrap { background: transparent !important; border: 0 !important; }
        .lg-pin {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 4px 14px rgba(30, 20, 16, 0.25);
          display: grid; place-items: center;
          color: #fff; font-size: 14px;
          cursor: pointer;
          transition: transform 0.12s ease;
          padding: 0;
        }
        .lg-pin:hover { transform: scale(1.12); }
        .lg-person {
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 3px 10px rgba(30, 20, 16, 0.28);
          display: grid; place-items: center;
          font-size: 11px;
        }
        .lg-person--friend {
          width: 22px; height: 22px;
          background: #f08a3c;
          color: #fff;
        }
        .lg-person--anon {
          width: 12px; height: 12px;
          background: rgba(30, 20, 16, 0.55);
          border-width: 1.5px;
        }
        .leaflet-container { background: #f4ecdb; font-family: inherit; }
      `}</style>
    </div>
  );
}

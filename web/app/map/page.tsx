import { Map as MapIcon } from "lucide-react";
import { CampusMap } from "@/components/map/campus-map-loader";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Campus map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">
      <header className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
            <MapIcon className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
              Campus map
            </h1>
            <p className="text-sm text-ink-500 mt-0.5">
              {user ? "Live UCSB — friends, classmates, and 30 buildings." : "30 UCSB buildings. Sign in for live people on campus."}
            </p>
          </div>
        </div>
      </header>
      <CampusMap signedIn={!!user} />
    </div>
  );
}

import { CampusHeading, CampusNav } from "@/components/campus-heading";
import { CampusMap } from "@/components/map/campus-map-loader";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Campus map", alternates: { canonical: "/map" } };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <div className="campus-page">
      <CampusHeading eyebrow="FIND YOUR NEXT STOP" title="Campus map" description="Find campus buildings. Sign in to see friends and classmates." />
      <CampusNav current="/map" />
      <CampusMap signedIn={!!user} />
    </div>
  );
}

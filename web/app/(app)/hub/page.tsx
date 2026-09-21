import Link from "next/link";
import { CampusHeading, CampusNav } from "@/components/campus-heading";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { TrendingClassesCard } from "@/components/widgets/trending-classes";
import { getWeeklyLeaderboard, getTrendingClasses } from "@/lib/queries";

export const revalidate = 30;
export const metadata = {
  title: "Your campus",
  description:
    "Explore UCSB dining, student guides, the campus map and Lagoon’s student community.",
  alternates: { canonical: "/hub" },
};

export default async function HomePage() {
  const [top, classes] = await Promise.all([
    getWeeklyLeaderboard(5),
    getTrendingClasses(5),
  ]);
  return (
    <div className="campus-page">
      <CampusHeading
        eyebrow="THE UCSB EDITION"
        title="What’s happening, Gaucho?"
        description="The useful stuff, all in one place. Find your next stop."
      />
      <CampusNav current="/hub" />
      <section className="campus-directory" aria-label="Campus essentials">
        {[
          ["01", "Dining", "Know before you bike over.", "/ucsb-dining-menu"],
          ["02", "Campus map", "Find your way around.", "/map"],
          ["03", "Student guides", "A little local knowledge.", "/guides"],
        ].map(([n, title, sub, href]) => (
          <Link key={href} href={href}>
            <span>{n} / CAMPUS ESSENTIALS</span>
            <h2>{title}</h2>
            <p>{sub}</p>
            <b aria-hidden="true">↗</b>
          </Link>
        ))}
      </section>
      <section className="campus-data-grid">
        <div className="card p-6">
          <div className="campus-card-heading">
            <h2>This week’s leaderboard</h2>
            <Link href="/leaderboard">Full board ↗</Link>
          </div>
          <LeaderboardTable rows={top} />
        </div>
        <TrendingClassesCard rows={classes} />
      </section>
      <div className="campus-inline-cta">
        <div>
          <h2>Your schedule and your people.</h2>
          <p>Keep them with you. Get Lagoon for iPhone.</p>
        </div>
        <a
          className="lagoon-button"
          href="https://apps.apple.com/us/app/ucsb-lagoon/id6760681142"
          data-lagoon-cta="campus"
        >
          Download free ↗
        </a>
      </div>
    </div>
  );
}

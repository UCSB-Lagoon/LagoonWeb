import type { Metadata } from "next";
import { CampusHeading } from "@/components/campus-heading";
import { CaptainForm } from "./form";

export const metadata: Metadata = {
  alternates: { canonical: "/captains" },
  title: "Captain Program — be one of the 20 Gauchos who launch Lagoon",
  description:
    "Apply to be a Lagoon campus captain. Free merch, paid dinners, a referral link that tracks your installs, and a real say in what we build for UCSB.",
  openGraph: {
    title: "Lagoon Captains — launch the UCSB campus app with us",
    description:
      "20 captains. Free hoodie, paid quarterly dinners, $50 Apple gift cards for top referrers, and a direct line to the founders.",
    url: "https://lagoonucsb.com/captains",
    images: ["/og-card.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lagoon Captains — UCSB",
    images: ["/og-card.png"],
  },
};

const PERKS = [
  {
    title: "Free Lagoon hoodie",
    body: "Embroidered, terra/cream colorway. You get it the day you're accepted.",
  },
  {
    title: "Paid team dinner / quarter",
    body: "Free food with the founders + the other captains. IV spots, no agenda.",
  },
  {
    title: "$50 Apple gift card",
    body: "Top 3 referrers each quarter. Tracked automatically via your link.",
  },
  {
    title: "Secret features early",
    body: "You see new releases two weeks before the rest of campus. Feedback gets shipped.",
  },
  {
    title: "Direct line to the team",
    body: "Private group chat. Pitch features, flag bugs, vote on roadmap. We actually listen.",
  },
  {
    title: "Captain badge in-app",
    body: "Gold flair on your profile + a permanent shoutout on the app's About page.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Apply",
    body: "60-second form below. Tell us why you're plugged in to UCSB and we'll get back within 48 hours.",
  },
  {
    n: "02",
    title: "Onboard",
    body: "Quick 15-min call. You get your referral link, hoodie order, and the first batch of share assets.",
  },
  {
    n: "03",
    title: "Share",
    body: "Post when it feels natural. Each install through your link counts toward perks — track it in your dashboard.",
  },
];

export default function CaptainsPage() {
  return (
    <div className="campus-page">
      <CampusHeading
        eyebrow="THE CAPTAIN PROGRAM"
        title="Bring your people."
        description="Help more Gauchos discover Lagoon. Share the app with your campus community and have a say in what we build next."
      />
      <a href="#apply" className="lagoon-button">
        Apply to be a captain ↗
      </a>
      <section className="captain-section">
        <h2>Here’s the deal.</h2>
        <p>
          For UCSB students who have spent at least one quarter on campus. Share
          when it feels natural, with no posting quotas. We’re recruiting a
          cohort of 20.
        </p>
        <ul className="captain-perks">
          {PERKS.map((p) => (
            <li key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="captain-section">
        <h2>From application to campus.</h2>
        <ol className="captain-steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section id="apply" className="captain-application">
        <div>
          <p className="text-xs text-ink-500">YOUR NEXT CHAPTER</p>
          <h2>Let’s meet.</h2>
          <p>
            Tell us a little about yourself and your UCSB community. We read
            every application.
          </p>
          <p>
            Captain posts should disclose your participation in the program.
            We’ll help with the language during onboarding.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <CaptainForm />
        </div>
      </section>
    </div>
  );
}

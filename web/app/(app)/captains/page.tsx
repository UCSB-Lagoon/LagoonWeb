import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy, Gift, Coffee, Sparkles, Shirt, Users, Flame, Megaphone, BadgeCheck } from "lucide-react";
import { CaptainForm } from "./form";

export const metadata: Metadata = {
  title: "Captain Program — be one of the 20 Gauchos who launch Lagoon",
  description:
    "Apply to be a Lagoon campus captain. Free merch, paid dinners, a referral link that tracks your installs, and a real say in what we build for UCSB.",
  openGraph: {
    title: "Lagoon Captains — launch the UCSB campus app with us",
    description:
      "20 captains. Free hoodie, paid quarterly dinners, $50 Apple gift cards for top referrers, and a direct line to the founders.",
    url: "https://app.lagoonucsb.com/captains",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", title: "Lagoon Captains — UCSB", images: ["/og.png"] },
};

const PERKS = [
  { icon: Shirt,    title: "Free Lagoon hoodie",       body: "Embroidered, terra/cream colorway. You get it the day you're accepted." },
  { icon: Coffee,   title: "Paid team dinner / quarter", body: "Free food with the founders + the other captains. IV spots, no agenda." },
  { icon: Gift,     title: "$50 Apple gift card",      body: "Top 3 referrers each quarter. Tracked automatically via your link." },
  { icon: Sparkles, title: "Secret features early",    body: "You see new releases two weeks before the rest of campus. Feedback gets shipped." },
  { icon: Megaphone,title: "Direct line to the team",  body: "Private group chat. Pitch features, flag bugs, vote on roadmap. We actually listen." },
  { icon: BadgeCheck, title: "Captain badge in-app",   body: "Gold flair on your profile + a permanent shoutout on the app's About page." },
];

const STEPS = [
  { n: "01", title: "Apply",     body: "60-second form below. Tell us why you're plugged in to UCSB and we'll get back within 48 hours." },
  { n: "02", title: "Onboard",   body: "Quick 15-min call. You get your referral link, hoodie order, and the first batch of share assets." },
  { n: "03", title: "Share",     body: "Post when it feels natural. Each install through your link counts toward perks — track it in your dashboard." },
];

export default function CaptainsPage() {
  return (
    <div className="relative overflow-x-clip">
      {/* Ambient blobs */}
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-orange-200/40 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute top-96 -right-24 w-[24rem] h-[24rem] rounded-full bg-amber-300/30 blur-3xl pointer-events-none" aria-hidden />

      {/* ───────────────── HERO ───────────────── */}
      <section className="max-w-7xl mx-auto px-5 pt-16 sm:pt-24 pb-12 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="pill mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              20 spots · Fall cohort
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[0.96] text-ink-900">
              Help us launch Lagoon <span className="italic-accent">at UCSB.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-ink-500 max-w-xl leading-relaxed">
              We&apos;re looking for 20 Gauchos who already make the campus more fun —
              Greek life, RAs, club leads, IV creators, the people whose stories you actually watch.
              You bring the network. We bring the app, the hoodies, and the dinners.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#apply" className="btn-primary">
                Apply to be a captain <ArrowRight className="w-4 h-4" />
              </a>
              <Link href="/" className="btn-secondary">
                <Trophy className="w-4 h-4 text-orange-500" /> See the live hub
              </Link>
            </div>
            <p className="mt-5 text-sm text-ink-400">
              Applications close when we hit 20. No filler — we read every one ourselves.
            </p>
          </div>

          {/* Hero side: "What you walk away with" stack */}
          <div className="lg:col-span-5">
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-orange-200/50 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-ink-400 font-semibold">What you get</span>
                  <span className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold">
                    <Flame className="w-3.5 h-3.5" /> Day 1
                  </span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 rounded-xl bg-cream-100 border border-cream-200 px-3 py-3">
                    <Shirt className="w-5 h-5 mt-0.5 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-bold text-ink-900">Lagoon hoodie</p>
                      <p className="text-sm text-ink-500">Embroidered. Ships the week you&apos;re in.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-cream-100 border border-cream-200 px-3 py-3">
                    <Users className="w-5 h-5 mt-0.5 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-bold text-ink-900">A trackable referral link</p>
                      <p className="text-sm text-ink-500">Every install is yours. Real-time dashboard.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-cream-100 border border-cream-200 px-3 py-3">
                    <Gift className="w-5 h-5 mt-0.5 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-bold text-ink-900">Top 3 / quarter = $50 each</p>
                      <p className="text-sm text-ink-500">Plus paid IV dinners with the team.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── PERKS GRID ───────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-12 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="pill mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            The deal
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
            Real rewards, <span className="italic-accent">not points.</span>
          </h2>
          <p className="mt-4 text-ink-500 text-lg">
            We&apos;re not running an MLM. Captains get tangible stuff for tangible work,
            and the relationship lasts as long as you&apos;re on campus.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map((p, i) => (
            <li key={p.title} className="card p-6 group">
              <div className="flex items-start justify-between mb-4">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_8px_22px_-10px_rgba(240,138,60,0.7)] group-hover:rotate-[-4deg] transition-transform">
                  <p.icon className="w-5 h-5" />
                </span>
                <span className="font-mono text-xs text-ink-300 tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900">{p.title}</h3>
              <p className="mt-2 text-ink-500 text-sm leading-relaxed">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────────── HOW IT WORKS ───────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-12 sm:py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4">
            <span className="pill mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              How it works
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
              Three steps. <br />
              <span className="italic-accent">No homework.</span>
            </h2>
            <p className="mt-4 text-ink-500 leading-relaxed">
              We respect your time. Captains average less than 30 minutes a week — mostly just sharing
              when it&apos;s natural. The work is being you, not being a salesperson.
            </p>
          </div>
          <ol className="lg:col-span-8 space-y-4">
            {STEPS.map(s => (
              <li key={s.n} className="card p-6 flex gap-5 items-start">
                <span className="font-display font-extrabold text-4xl sm:text-5xl text-orange-500/90 tabular-nums leading-none w-16 shrink-0">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display font-bold text-xl text-ink-900">{s.title}</h3>
                  <p className="mt-1.5 text-ink-500 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────────── WHO WE WANT ───────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-12 sm:py-20">
        <div className="card-tinted p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-orange-300/40 blur-3xl" aria-hidden />
          <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-amber-400/40 blur-3xl" aria-hidden />
          <div className="relative grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
                You&apos;re probably a captain if…
              </h2>
              <p className="mt-3 text-ink-500">
                We don&apos;t need follower counts. We need real network density.
              </p>
            </div>
            <ul className="space-y-3 text-ink-700">
              {[
                "You&apos;re plugged into a UCSB community — Greek house, club, dorm, team, friend group.",
                "Your friends actually take your recs (apps, restaurants, classes).",
                "You&apos;ve been at UCSB at least one quarter — you know the rhythm of campus.",
                "You&apos;d say yes to free food, hoodies, and the chance to shape what students use daily.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="grid place-items-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <span dangerouslySetInnerHTML={{ __html: t }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────── APPLY FORM ───────────────── */}
      <section id="apply" className="max-w-3xl mx-auto px-5 py-12 sm:py-20 scroll-mt-24">
        <div className="text-center mb-10">
          <span className="pill mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            60 seconds
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
            Apply to be a captain.
          </h2>
          <p className="mt-3 text-ink-500 text-lg">
            We read every application ourselves and reply within 48 hours.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <CaptainForm />
        </div>

        <p className="mt-6 text-sm text-ink-400 text-center">
          Already have a captain link? <Link href="/r/example?noredirect=1" className="text-orange-600 font-semibold hover:underline">See what shared links look like →</Link>
        </p>
      </section>

      {/* ───────────────── FAQ ───────────────── */}
      <section className="max-w-3xl mx-auto px-5 pb-24">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink-900 text-center mb-8">FAQ</h2>
        <dl className="space-y-3">
          {[
            { q: "Do I have to post a certain amount?", a: "No quotas. We track real installs from your link — that's the only metric. Share when it feels natural." },
            { q: "Is there a commitment?", a: "One quarter minimum. You can drop out anytime by emailing us — no awkward exit." },
            { q: "Do I get paid?", a: "Top 3 referrers each quarter get a $50 Apple gift card. Everyone gets the hoodie, the dinners, and early access — those are flat perks." },
            { q: "Is this paid promotion / do I have to disclose?", a: "If you post about Lagoon as a captain you should mention you're part of the program — same as any creator/brand relationship. We'll give you the language." },
            { q: "Can I apply if I just transferred?", a: "Yes — transfer captains are great because you bring a different network. We just want at least one quarter on campus first." },
          ].map(item => (
            <details key={item.q} className="card p-5 group">
              <summary className="cursor-pointer font-display font-bold text-ink-900 flex items-center justify-between list-none">
                {item.q}
                <span className="text-orange-500 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-ink-500 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </dl>
      </section>
    </div>
  );
}

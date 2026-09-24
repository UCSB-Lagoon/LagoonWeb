# Growth analytics & Instagram ads — 22 September 2026

A record of what was set up, what the data said, and what to do next.
Written the day before fall instruction starts (Week 0, Tuesday).

---

## 1. What was added to the website

All of it is **inert until you set two environment variables in Vercel**, so
merging it changes nothing on its own.

| Piece | File | Turns on with |
|---|---|---|
| Meta (Instagram) Pixel | `web/components/meta-pixel.tsx` | `NEXT_PUBLIC_META_PIXEL_ID` |
| App Store campaign links | `web/components/app-store-campaign.tsx` | `NEXT_PUBLIC_APPSTORE_PROVIDER_TOKEN` |
| Privacy page + opt-out | `web/app/(marketing)/privacy/` | always on (linked in the footer) |

### What the pixel sends

Only three things, on marketing and app pages (never `/admin`, `/auth`,
`/login`, `/me`):

- **PageView** on every route.
- **Lead** when someone taps any App Store link — the standard event Meta can
  optimize ad delivery toward.
- **AppStoreClick** (custom) with which button was tapped (`nav`, `hero`,
  `inline`, …) — for reporting.

It does **not** load when the browser sends Global Privacy Control, or after
someone taps "Do not sell or share my information" on `/privacy`. Every UCSB
visitor is in California, where feeding an ad platform counts as "sharing"
under the CCPA/CPRA, so the opt-out is required, not optional.

**The app is untouched.** Its privacy policy promises no third-party ad
tracking and that is still true — the pixel is website-only. If you ever add
the Meta SDK to the app, the App Store privacy labels and the in-app policy
must change with it, and you need the App Tracking Transparency prompt.

### Why the App Store link rewrite matters most

The pixel **cannot see installs** — the App Store is Apple's page. The only
place an ad can be tied to an install is App Store Connect → Analytics →
Acquisition → Campaigns, and that needs two parameters on the App Store URL:

- `pt` — your provider token (fixed, from App Store Connect)
- `ct` — a campaign name, max 40 chars

`app-store-campaign.tsx` adds both at tap time. `ct` comes from the landing
URL: `utm_source` + `utm_campaign` (e.g. `instagram-fall_launch`), else
`meta` if there's an `fbclid`, else the referring site, else `web`.

### Status

- **23 Sep — Meta Pixel live.** Dataset "Lagoon website", ID
  `1790273445326801`, in the "Lagoon — UCSB Campus App" business portfolio.
  Set as `NEXT_PUBLIC_META_PIXEL_ID` (Production) on the Vercel project
  **lagoon-web-app** (the one serving lagoonucsb.com); PageView confirmed
  firing on the live site.
- **23 Sep — App Store campaign links live.** Provider token `123978416` set
  as `NEXT_PUBLIC_APPSTORE_PROVIDER_TOKEN` (Production); confirmed on the live
  site (`?utm_source=instagram&utm_campaign=verify_test` → `ct=instagram-verify_test`).
  That check also sent one test `Lead`/`AppStoreClick` to the pixel and one
  `app_store_click` to GA — ignore campaign `verify_test` in reports.
- **Instagram bio link:** `https://apps.apple.com/app/apple-store/id6760681142?pt=123978416&ct=ig_bio&mt=8`
- **23 Sep — lagoonucsb.com verified in Meta** (TXT record added at Namecheap,
  confirmed on Namecheap, Google and Cloudflare resolvers).
- **Domain verification (how it was done):** DNS is at **Namecheap** (nameservers
  `dns1/dns2.registrar-servers.com`), not Vercel, so the record goes in
  Namecheap → Domain List → lagoonucsb.com → Advanced DNS: TXT, host `@`,
  value `facebook-domain-verification=ds5oh5wsg1yywk6nvl613kqisf05wu`. Keep
  the existing `google-site-verification` TXT record alongside it.

### Turning it on

1. **Meta Pixel** — Meta Business Suite → Events Manager → Connect data
   sources → Web → create a pixel named "lagoonucsb.com". Copy the numeric
   pixel ID.
2. **Provider token** — App Store Connect → Analytics → Acquisition →
   Campaigns → "Generate a Campaign Link". The generated URL contains
   `pt=123456`; the number is the token.
3. Vercel → LagoonWeb project → Settings → Environment Variables (Production):
   `NEXT_PUBLIC_META_PIXEL_ID` and `NEXT_PUBLIC_APPSTORE_PROVIDER_TOKEN`.
   Redeploy — these are baked in at build time.
4. Verify: Events Manager → Test events → open lagoonucsb.com → you should
   see PageView, and Lead + AppStoreClick when you tap "Get the app".
5. **Verify the domain** `lagoonucsb.com` in Meta Business Settings →
   Brand safety → Domains, so the pixel's events count for your ads.

Tested on a production build with placeholder IDs on 22 Sep: pixel loads and
hands off its queue, PageView/Lead/AppStoreClick reach Meta, the App Store
link becomes `…?pt=…&ct=instagram-fall_launch&mt=8` from an ad URL, and the
opt-out stops the script from loading.

---

## 2. Running Instagram ads with it

**For app installs** (the main goal) use Meta's **App promotion** objective
pointed at the App Store listing. Meta measures those installs itself through
Apple's SKAdNetwork — no pixel or SDK needed. Budget-wise this is the one to
start with.

**For the website** (guides, `/go`, share landers) use **Traffic** or
**Leads**, optimizing for the `Lead` event once it fires ~50 times a week.

Put these URL parameters on every ad that links to the site (Ads Manager →
ad → Tracking → URL parameters):

```
utm_source=instagram&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

That one line makes GA4, the pixel, and App Store Connect all agree on which
ad a visit came from.

**Audiences to build** (Ads Manager → Audiences), once the pixel has a week
of data:

| Audience | Definition | Use |
|---|---|---|
| Site visitors 30d | All website visitors, 30 days | retarget with "you looked — here's the app" |
| Tapped Get the app | `Lead`, 30 days | **exclude** from install ads (they've likely installed) |
| Lookalike 1% | from `Lead`, United States, narrowed by location to Santa Barbara / Isla Vista / Goleta | prospecting once `Lead` has 100+ people |
| Instagram engagers | People who engaged with @ucsblagoon, 90 days | cheapest warm audience you have today |

Location targeting: a ~5 mile radius around campus plus Isla Vista, ages
18–24. Interest targeting matters less than location for a campus app.

**Instagram bio link.** It currently points straight at the App Store with no
campaign token, so App Store Connect files those installs under "App Store
Browse"/"Web Referrer" instead of Instagram. Replace it with a campaign link
from App Store Connect with `ct=ig_bio`. One tap, and you'll see exactly how
many installs the bio drives.

---

## 3. What the data says (first-party, Supabase, 22 Sep)

Google Analytics could not be read from this session — see §5. These numbers
are from Lagoon's own tables (`user_profiles`, `analytics_events`,
`user_courses`, `friendships`).

**Accounts**

| | |
|---|---|
| Accounts | 170 |
| New, last 7 days | 42 |
| New, last 30 days | 89 |
| Weekly active (any event, 7d) | 78 signed-in users |
| Daily active (24h) | 31 |
| Have any classes saved | 82 (48%) |
| Have **fall 2026** classes | **36 (21%)** |
| Accepted friendships | **10** |

Signups by day have climbed into move-in week: 1–4 a day in early September,
6–11 a day from 18 Sep (11 on the 21st).

**Retention** (accounts created 14–60 days ago, n=28): 50% came back in days
1–7, 61% in days 7–14. Small sample, but healthy for a utility.

### The three findings that matter

**1. Most people are on old builds, and old builds can't import.**
Of the installs active this week (signed in or not), **67 are on 1.12 and 45 on 1.13; only 17 are
on 1.15** and a handful on 1.16+. Screenshot import on 1.10/1.12 started
~59 times and succeeded **7** times. On 1.15 it succeeded 7 of 8. The fix
exists; the users don't have it. This is why only 21% of accounts have a
fall schedule — and without a schedule, Today, Quarter and "who's in my
class" are all empty.

**2. The social graph hasn't started.** 10 friendships across 170 accounts.
"Who's in my class?" is the viral loop, and it only pays off once friends
connect. Classmate *counts* work (anonymous), but nobody is adding each other.

**3. Onboarding completion is low.** 35 of 170 accounts completed onboarding.
Most accounts predate the current flow, but it's worth watching now that 1.18
ships the new setup.

---

## 4. Recommendations, in order

1. **Ship 1.18 and get people onto it.** Add an in-app "update available"
   prompt (check `itunes.apple.com/lookup?id=6760681142` on launch, compare
   `version`, show a one-line banner on Today). Nothing else here moves while
   most users run a build whose screenshot import failed ~88% of the time.
2. **Make the first week about importing.** Promotional text says it (§6); an
   Instagram story sequence showing "screenshot GOLD → your week in color" in
   under 30 seconds is the ad to run first.
3. **Seed the friend graph.** After a successful import, prompt "Add 3 people
   from your classes" using the classmate suggestions — a one-screen step,
   not a buried tab.
4. **Turn on the pixel and campaign links** (§1) before spending anything on
   ads, so the first dollar is measured.
5. **Mark GA4 key events.** In GA4 → Admin → Events, mark `app_store_click`
   as a key event on the marketing stream (`G-2F8CTN4DNP`) if it isn't
   already. Then GA reports conversion rate by source, including Instagram.
6. **Put an app privacy policy on the web.** The App Store listing needs a
   privacy policy URL; the site had none (`/privacy` was a 404 until today,
   and today's page covers the website). Add the in-app policy's content to
   it — and update that policy, which still says the schedule is stored only
   on-device (it syncs to Supabase since mid-September).

---

## 5. Google Analytics — still to do

GA4 is installed and correct (two streams: marketing `G-2F8CTN4DNP`, app
`G-5HY7LBXP8G`; page views, `app_store_click`, `conversion`, scroll depth).
The *data* couldn't be read: the Claude in Chrome extension wasn't connected
and there's no GA API access on this machine. Either connect the extension
(signed in to the Google account that owns the property) or export the
reports below as CSV, and the overview can be finished:

- Reports → Acquisition → Traffic acquisition, last 28 days (sessions, engaged
  sessions, key events by session source/medium)
- Reports → Engagement → Pages and screens, last 28 days
- Reports → Engagement → Events, filtered to `app_store_click`
- Explore → Funnel: `page_view` (/) → `scroll_depth` 50 → `app_store_click`

The questions to answer: how much traffic Instagram already sends
organically, which guides convert to App Store taps, and what share of
homepage visitors tap "Get the app".

---

## 6. App Store Connect copy for 1.18

Source of truth: `Lagoon/AppStoreMedia/APP_STORE_METADATA.md` in the iOS repo.

**Promotional Text** (151/170, changeable anytime without review):

> Fall quarter starts Thursday. Screenshot your GOLD schedule, see your whole
> week in color, and find out who's in your classes before the first lecture.

**What's New in This Version** — upload **build 25**, not 24:

```
Setup gets you to the good part faster: sign up, import your classes, and see your whole week before anything else.

Also in this update:
• Add your name so classmates know it's you
• Quarter opens with your units, week, and weeks left at a glance
• Today shows what's happening around UCSB, and all-day events read "All day"
• Applied Mathematics, a second major, and AP credit in the degree planner
• Re-importing your schedule no longer adds a class twice
• Unit totals count each course once, even with a 0-unit section
• Friend suggestions show major and year, not email addresses
• Opens faster, without a white flash or the screen jumping
```

**Screenshots** — five new frames in `AppStoreMedia/output/6.9-1290x2796/`
(and `6.5-1284x2778/`), `01_week_framed` … `05_campus_framed`. Replace all
current screenshots, in that order.

**Keywords** — leave as is (99/100, no words repeated from name/subtitle).

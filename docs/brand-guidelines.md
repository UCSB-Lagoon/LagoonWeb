# Lagoon Brand Guidelines

> **Single source of truth for the unified design language.**
> Two stylesheets implement these exact tokens: the marketing system
> (`web/public/site.css` — `:root`, plus the folded HOMEPAGE band) and the
> Next.js app (`web/app/globals.css` — `@theme`). A user moving from a guide
> page → `/captains` → `/hub` should feel one product. If you change a token,
> change it in **both** places in the same commit. (The marketing pages are
> now React/MDX served from `app/(marketing)/`; there is no more `home.html`.)

## Brand Identity
**Name:** Lagoon
**Tagline:** Campus life, beautifully simple.
**Positioning:** The all-in-one UCSB campus app — built for Gauchos, by Gauchos.

---

## Color Palette (navy / cream / gold)

**Aligned to the iOS app's 2026-09 repaint.** This site used to carry its own
warm-orange identity deliberately, and that was the right call while the app
was Deep Pacific + terracotta with serif-italic mastheads — a genuinely
different animal. The repaint changed the premise: the app's light mode is now
cream-ground with navy ink and a gold accent, which is what this site already
was in structure. They are one brand again.

Upstream source: `Lagoon/DESIGN_SYSTEM.md` in the app repo. Four decisions:

1. Navy `#001E30` ground, cream `#F4F1EA` ink — inverted for light pages.
2. Electric Gold `#FFD200` is the **only** accent, once per screen.
3. Nothing is a gradient; nothing casts a shadow. Surfaces separate by a
   lighter step plus a hairline.
4. One tight grotesque (**Inter** on web, SF Pro in the app), negative
   tracking at display sizes.

### Fill vs. ink — the rule that bites most often

Gold is a **fill**, not a text colour. `#FFD200` on the cream ground is
**1.3:1**; it is invisible. The rule has a direction, and the direction is the
part people get wrong:

| You are painting text on… | Use | Light | Dark |
|---|---|---|---|
| the cream page, or a cream card | `--gold-ink` | `#7f6200` | `#ffd200` |
| a **painted navy band** (a dark section on a light page) | `--gold-on-dark` | `#ffd200` | `#ffd200` |
| a **painted gold plate** (a gold pill, the logo tile) | `--on-accent` | `#001e30` | `#001e30` |

`--gold-ink` flips with the theme because its ground does. The other two do
**not** flip, because their grounds do not: a navy band is navy at midnight
and at noon, and so is a gold pill. Pointing either of them at a theme-aware
name is the single most repeated bug in this codebase — it has produced a
1.1:1 logo, a 1.3:1 rarity badge, a 2.43:1 pill and a 2.97:1 masthead word,
all from tokens that were individually correct.

The same trap runs the other way for navy: `--pacific` is a fill; as ink on
the night page it is ~1.3:1, so read text uses `--pacific-ink`.

### Tokens

Defined once in `web/app/globals.css` `@theme`, mirrored into
`web/public/site.css` as `var(--color-x, #fallback)` pairs. `npm run check:brand`
fails the build if a fallback drifts, if a colour is written anywhere else, or
if a theme-invariant token is built from a name that flips.

| Role | Token | Light | Dark |
|---|---|---|---|
| Page background | `--bg` | `#f4f1ea` | `#001e30` |
| Secondary surface | `--bg-alt` | `#ebe7dc` | `#002a42` |
| Card surface | `--panel` | `#fbf9f3` | `#00304c` |
| Elevated card | `--panel-elevated` | `#ffffff` | `#003a5c` |
| Divider | `--line` | `#dfd9ca` | `rgba(255,255,255,.10)` |
| Heading ink | `ink-900` | `#001e30` | `#f4f1ea` |
| Body ink | `ink-700` | `#003a60` | `#a9bdc9` |
| Muted ink | `ink-500` | `#4a5d6b` | `#8ea5b3` |
| Faint ink | `ink-400` | `#546876` | `#8ea5b3` |
| Accent fill | `--gold` | `#ffd200` | `#ffd200` |
| Accent pressed | `--gold-pressed` | `#e6bd00` | `#e6bd00` |
| Live green | — | `#2ecc71` | `#2ecc71` (pulse dot only) |

**Every ink step is chosen against the worst surface it lands on, not the
page.** That is the discipline the table above encodes and the thing that
keeps breaking when it is forgotten: `ink-400` measured 4.85:1 on the cream
page and 4.42:1 on `cream-100`; at night `ink-500` was 5.47:1 on the navy
page and 3.82:1 on an elevated navy card. Both shipped. Checking a colour
against the background you designed it on proves nothing.

- **Accent is used sparingly** — buttons, links, key moments; once per screen.
- **Status colours do not exist yet.** Success/warning/danger badges in
  `/admin` still use stock Tailwind `emerald`/`rose`/`sky`. They are the only
  non-brand hues left in the product and they are on internal screens only.

---

## Typography

| Role | Font | Treatment |
|---|---|---|
| Display / headings | Inter 700–800 | `letter-spacing: -0.028em`, `line-height: 0.96–1.1`, `text-wrap: balance` |
| Body / UI | Inter 400–600 | `line-height: 1.65`, body copy max width ~60–66ch |
| Mono / eyebrows | Space Mono 700 | uppercase, `letter-spacing: 0.10–0.18em` |
| Emphasis in a headline | Inter 800 + `--gold-ink` | **upright** — see below |

Font stack: `var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif`

**There is no serif and no italic.** The 2026-09 repaint retired the
Fraunces-italic voice: emphasis is weight and colour now, one tight grotesque
throughout. The retirement was applied to the hero `h1 em` and missed four
other `em` rules, so the homepage spent a while speaking in two voices at
once — if you are adding an accent word, it is `font-style: normal;
font-weight: 800; color: var(--gold-ink)`.

Type scale (fluid): h1 `clamp(54px, 6.5vw, 88px)` · h2 `clamp(40px, 4.5vw, 60px)`
· h3 `1.3rem` · body `1.0–1.08rem` · small `0.875rem`.

---

## UI Components

- **Border radius:** cards `22px` · tiles `20px` · inputs `14px` · buttons and
  pills `9999px`.
- **No gradients, no shadows.** Surfaces separate by a lighter step plus a
  hairline. `--shadow*` still exists and resolves to a hairline so the ~49
  legacy `box-shadow` call sites degrade to an edge; do not add more.
- **Primary button:** `--gold` fill, `--on-accent` ink, pill. Never white ink
  on gold — that is 1.4:1.
- **Secondary button:** `--panel-elevated` bg, `ink-900` text, `--line`
  border, pill.
- **Card:** `--panel-elevated` bg, `--line` hairline, `22px` radius.
  Use `--panel-elevated`, never a literal `bg-white`: white does not flip, so
  at night it leaves theme-aware ink stranded on a white plate at 1.1–2.6:1.
- **Pill / tag:** uppercase Space Mono, `--gold` plate, `--on-accent` ink.
- **Body texture:** fixed dotted radial grid at `24px`, masked to fade toward
  the bottom. Present on every page.

## Shared chrome

- **Header:** sticky, `--bg` at ~85% with `backdrop-blur`, hairline `--line`
  border that appears on scroll. 64px tall. Brand = flat gold rounded "L" tile
  with `--on-accent` ink + "Lagoon" wordmark + "UCSB" overline.
- **Primary nav CTA:** gold primary button ("Get the App"), App Store link
  with `data-lagoon-cta` attribution.
- **Footer:** tinted CTA strip → 4-column link grid → legal bar with live dot.

## Accessibility

- All text meets WCAG AA on the surface it actually sits on: 4.5:1 normal,
  3:1 at ≥24px (or ≥18.66px bold).
- **This is measured, not reviewed.** `web/e2e/contrast.spec.ts` walks every
  visible text node on 7 routes × 2 themes against a production build and
  fails CI on a single pairing. A brand linter cannot catch these — both
  sides of a 1.3:1 pairing are legal tokens. Run it with `npm run test:contrast`.
- Decorative imagery (the phone mockup, the "Guides" watermark, the feature
  marquee) is `aria-hidden` and exempt from the contrast rule — but it is
  still styled to be legible. `aria-hidden` is not a way to silence a failure.
- Visible focus: `2px solid` `--gold`, `2px` offset.
- Semantic heading order (one `h1` per page, no skipped levels).
- All meaningful images have `alt`; decorative ones `alt=""`/`aria-hidden`.

---

## Tone of Voice
- **Friendly & peer-to-peer** — speaks like a fellow Gaucho, not a corporation
- **Confident but chill** — direct statements, no fluff
- **Clever, not try-hard** — light wit where appropriate
- **Action-oriented** — "Stop switching between a dozen apps." / "Know before you bike over."

### Do
- Use contractions ("you're", "what's")
- Lead with the student benefit
- Be specific (name real places: Carrillo, Storke Plaza, GOLD)

### Don't
- Use corporate jargon or buzzwords
- Over-explain features — show, don't tell
- Use exclamation marks excessively

---

## Brand Personality
- **Modern** — clean warm UI, large confident typography, no clutter
- **Student-first** — every feature reduces friction for UCSB students
- **Transparent** — student gov spending, grade data, open by design
- **Energy:** Medium — calm confidence, not hype

## Target Audience
- **Primary:** UCSB undergraduate students (18–22)
- **Secondary:** Graduate students, UCSB staff
- **Market size:** ~37,000 Gauchos on campus

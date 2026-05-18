# Lagoon Brand Guidelines

> **The iOS app is canonical. This doc is the *web port* of it.**
> The single source of truth for the brand — palette, the "coastal
> editorial" voice, motion, typography intent — is the Lagoon app's
> **`DESIGN_SYSTEM.md`** (in the `Lagoon` repo). When the two disagree,
> the app wins, and this file gets updated to match — never the reverse.
>
> Two stylesheets implement the tokens below for the web: the marketing
> system (`web/public/site.css` — `:root`, plus the folded HOMEPAGE band)
> and the Next.js app (`web/app/globals.css` — `@theme`). A user moving
> from a guide page → `/captains` → `/hub` → the iOS app should feel one
> product. If you change a token, change it in **both** web places in the
> same commit, and only to track an app-side change.
>
> **Note on token names:** `web/app/globals.css` keeps the legacy Tailwind
> token names `orange-*` and `site.css` keeps `--gold*` / `--orange*` for
> the *primary-action role*, but their **values are now the app's Deep
> Pacific ramp** (`#003660`). Renaming ~150 usages was deferred as pure
> churn; the names are a known misnomer, the values are correct. True
> Electric Gold lives in `--accent-gold` / `amber-400` (emphasis only).

## Brand Identity
**Name:** Lagoon
**Tagline:** Campus life, beautifully simple.
**Positioning:** The all-in-one UCSB campus app — built for Gauchos, by Gauchos.

---

## Color Palette (coastal editorial)

Mirrors the app's **Lagoon Classic** palette (`DESIGN_SYSTEM.md` → Color).
Deep-ink-on-sandstone, Deep Pacific as the primary brand/action color,
Electric Gold for emphasis only, Terracotta for community warmth, Kelp for
calm/utility. Light-mode first; class-based dark mode uses the app's cool
midnight (`#0C1B2A`) — marketing pages are light only.

| Role | App name | Token (web) | Hex | Usage |
|---|---|---|---|---|
| Page background | sandstone | `cream-50` | `#f8f3ea` | Body / page background |
| Secondary surface | — | `cream-100` | `#efe7d6` | Subtle fills, hover, code |
| Divider / border | — | `cream-200` | `#e2d4ba` | Card borders, hairlines |
| Card surface | cardBackground | `panel` | `#ffffff` | Cards, panels |
| Heading ink | primaryText | `ink-900` | `#16242e` | Headings, primary text |
| Body ink | secondaryText | `ink-700` | `#2c3a44` | Body copy |
| Muted ink | tertiaryText | `ink-500` | `#5d6b73` | Secondary copy |
| Faint ink | — | `ink-400` | `#87949b` | Labels, metadata |
| **Primary / CTA** | **deepPacific** | `orange-500`* / `--gold` | `#003660` | Primary buttons, links, focus |
| Primary deep | — | `orange-600`* / `--gold-pressed` | `#00263f` | Button hover, active |
| Primary light | — | `orange-300`* | `#1f5d86` | Gradients, glows |
| **Emphasis** | **electricGold** | `amber-400` / `--accent-gold` | `#febc11` | Kicker/eyebrow, the one emphasized headline word |
| Community | terracotta | `terracotta-500` | `#c8754c` | People/social surfaces, warm accents |
| Utility | kelpGreen | `kelp-500` | `#527a67` | Confirmations, calm surfaces |
| Live green | — | — | `#2ecc71` | Live-data pulse dot only |

\* misnamed legacy token — see the note at the top of this file.

- **Color is architecture, not garnish** (app rule). Deep Pacific fills
  primary actions and dark hero bands; it is not a 1px border accent.
- **Electric Gold is the *one* emphasis** — eyebrows and a single
  serif-italic word in a masthead. Never body text (fails contrast on sand).
- **Dark hero bands** use Pacific-midnight (`--night #0c1b2a`) with
  `ink-light` text and a gold emphasis word — exactly the app's Today hero.

---

## Typography

Mirrors the app's two-system split: a serif-italic **voice** for hero
mastheads (app `LagoonEditorial`), Space Grotesk as the **workhorse** UI
type (app `LagoonFont`).

| Role | Font | Treatment |
|---|---|---|
| **Masthead / hero** | **Fraunces italic 600** | The signature voice. Serif italic, `letter-spacing: -0.025em`, `line-height: ~1.02`, `text-wrap: balance`. Used on `.hero-copy h1` / `.masthead`. One per screen. |
| Section headings | Space Grotesk 800 | `letter-spacing: -0.04em`, `line-height: 1.0–1.1` |
| Body / UI | Space Grotesk 400–600 | `line-height: 1.65`, body copy max width ~60–66ch |
| Mono / eyebrows | Space Mono 700 | uppercase, `letter-spacing: 0.18–0.2em`, Electric Gold |
| Italic accent | Fraunces italic 600 | the one emphasized word in a headline (`.italic-accent`, Terracotta) |

Font stack: `"Space Grotesk", ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`

Type scale (fluid): h1 `clamp(2.8rem, 6vw, 5rem)` · h2 `clamp(2rem, 4vw, 3.4rem)`
· h3 `1.3rem` · body `1.0–1.08rem` · small `0.875rem`.

---

## UI Components

- **Border radius:** cards/panels `1.25rem` (20px) · buttons & pills `9999px`
  (fully round) · inputs/code `12px`.
- **Primary button:** solid Deep Pacific (`#003660`) bg, white text, pill,
  subtle inset highlight + Pacific drop shadow; hover → `#00263f`,
  `translateY(-1px)`.
- **Secondary button:** white bg, `ink-900` text, `cream-200` border, pill;
  hover → `cream-100` bg, Pacific-tinted border.
- **Card:** white bg, `cream-200` border, `1.25rem` radius, soft cool shadow
  `0 22px 40px -28px rgba(0,54,96,0.20)`; hover lifts `-2px` with
  Pacific-tinted border.
- **Pill / tag:** uppercase Space Mono, Electric-Gold-tinted bg + border,
  Pacific text.
- **Body texture:** fixed dotted radial grid
  `radial-gradient(rgba(30,20,16,0.055) 1px, transparent 1px)` at `24px`,
  masked to fade out toward the bottom. Present on every page.

## Shared chrome

- **Header:** sticky, `cream-50` at ~85% with `backdrop-blur`, hairline
  `cream-200` border that appears on scroll. 64px tall. Brand = gradient
  Electric-Gold→Deep-Pacific rounded "L" tile + "Lagoon" wordmark + "UCSB"
  overline.
- **Primary nav CTA:** Deep Pacific primary button ("Get the App"), App
  Store link with `data-lagoon-cta` attribution.
- **Footer:** tinted CTA strip (`card-tinted` gradient, soft Pacific
  blur blobs) → 4-column link grid on `cream-50` → legal bar with live dot.

## Accessibility

- Body/heading ink on sandstone meets WCAG AA (≥ 4.5:1). `ink-400` only for
  large/decorative text. Electric Gold is never used for body text.
- Visible focus: `2px solid` Deep Pacific (`#003660`), `2px` offset.
- `prefers-reduced-motion` honored in both stylesheets (kills float/pulse/
  live-dot + collapses transitions).
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

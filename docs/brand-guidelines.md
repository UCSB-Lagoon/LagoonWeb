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

## Color Palette (warm editorial light theme)

Dark-on-cream, warm orange accent. Light-mode first; the app additionally
supports a class-based dark mode (`globals.css` `.dark`) — marketing pages are
light only.

| Role | Token | Hex | Usage |
|---|---|---|---|
| Page background | `cream-50` | `#faf6ee` | Body / page background (all systems) |
| Secondary surface | `cream-100` | `#f4ecdb` | Subtle fills, hover, code blocks |
| Divider / border | `cream-200` | `#ead9bf` | Card borders, hairlines |
| Card surface | `panel` | `#ffffff` | Cards, panels, elevated surfaces |
| Heading ink | `ink-900` | `#1e1410` | Headings, primary text |
| Body ink | `ink-700` | `#2a1a0f` | Body copy |
| Muted ink | `ink-500` | `#6b5b4a` | Secondary copy, captions |
| Faint ink | `ink-400` | `#8c7a66` | Labels, metadata |
| Accent / CTA | `orange-500` | `#f08a3c` | Primary buttons, links, highlights |
| Accent deep | `orange-600` | `#d9701f` | Button hover, active links |
| Accent light | `orange-300` | `#ff9f5c` | Gradients, glows |
| Amber | `amber-400` | `#febc11` | Logo-mark gradient stop only |
| Live green | — | `#2ecc71` | Live-data pulse dot only |

- **Accent is used sparingly** — buttons, links, key moments. Not large fills.
- **Dark surfaces** (e.g. marketing `.value-card`, app phone mockups) use
  `ink-900 #1e1410` as the base with `cream-50` text.

---

## Typography

| Role | Font | Treatment |
|---|---|---|
| Display / headings | Space Grotesk 700 | `letter-spacing: -0.03em`, `line-height: 1.0–1.1`, `text-wrap: balance` |
| Body / UI | Space Grotesk 400–600 | `line-height: 1.65`, body copy max width ~60–66ch |
| Mono / eyebrows | Space Mono 700 | uppercase, `letter-spacing: 0.10–0.18em` |
| Italic accent | Fraunces italic 600 | optional emphasis word in a headline (`.italic-accent`) |

Font stack: `"Space Grotesk", ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`

Type scale (fluid): h1 `clamp(2.8rem, 6vw, 5rem)` · h2 `clamp(2rem, 4vw, 3.4rem)`
· h3 `1.3rem` · body `1.0–1.08rem` · small `0.875rem`.

---

## UI Components

- **Border radius:** cards/panels `1.25rem` (20px) · buttons & pills `9999px`
  (fully round) · inputs/code `12px`.
- **Primary button:** solid `orange-500` bg, white text, pill, subtle
  inset highlight + warm drop shadow; hover → `orange-600`, `translateY(-1px)`.
- **Secondary button:** white bg, `ink-900` text, `cream-200` border, pill;
  hover → `cream-100` bg, orange-tinted border.
- **Card:** white bg, `cream-200` border, `1.25rem` radius, soft warm shadow
  `0 22px 40px -28px rgba(176,110,60,0.18)`; hover lifts `-2px` with
  orange-tinted border.
- **Pill / tag:** uppercase Space Mono, `orange-100` bg, `orange-700` text.
- **Body texture:** fixed dotted radial grid
  `radial-gradient(rgba(30,20,16,0.055) 1px, transparent 1px)` at `24px`,
  masked to fade out toward the bottom. Present on every page.

## Shared chrome

- **Header:** sticky, `cream-50` at ~85% with `backdrop-blur`, hairline
  `cream-200` border that appears on scroll. 64px tall. Brand = gradient
  amber→orange rounded "L" tile + "Lagoon" wordmark + "UCSB" overline.
- **Primary nav CTA:** orange primary button ("Get the App"), App Store link
  with `data-lagoon-cta` attribution.
- **Footer:** tinted CTA strip (`card-tinted` gradient, soft orange/amber
  blur blobs) → 4-column link grid on `cream-50` → legal bar with live dot.

## Accessibility

- Body/heading ink on cream meets WCAG AA (≥ 4.5:1). `ink-400` only for
  large/decorative text.
- Visible focus: `2px solid orange-500`, `2px` offset.
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

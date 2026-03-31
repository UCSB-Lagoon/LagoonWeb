# Lagoon Web — Changelog

## [2026-03-31] — Warm Editorial Redesign

### Summary
Full visual and copy overhaul to match the current iOS app design direction: warmer surfaces, editorial typography, and expanded feature storytelling.

### Design System
- **New palette**: Warm charcoal backgrounds (`#0b0906`), cream text (`#ede3d0`), terracotta (`#c4572a`), ochre (`#c98b2a`) — replacing the previous cold dark-blue SaaS palette
- **Typography**: `DM Serif Display` for all headings (h1/h2/h3) + `Manrope` for UI/body — creates warm editorial authority
- **Texture**: Subtle CSS SVG noise layer over the entire page for a paper/canvas feel
- **Removed**: All `output/*.png` app screenshots (low quality, not representative of current design)
- **Phone mockups**: Fully CSS-only, warm-themed screens (no images required)

### New Sections
- **Widgets section**: Shows an iPhone home screen with a Lagoon schedule widget, copy about lock screen utility
- **Native News reading section**: Shows the editorial Daily Nexus reading experience with serif-forward article cards, copy emphasizing it's no longer a web link
- **Social / Compare Schedules**: Updated share card with warm ochre/terracotta tones replacing the cold indigo palette

### Copy Updates
- Hero H1: "Campus life, *beautifully yours.*" (one clear emotional promise)
- Hero subtext: references GOLD, Carrillo, Storke Plaza, Daily Nexus by name
- All feature card descriptions are UCSB-specific (HSSB, De La Guerra, Phelps, Campbell Hall, etc.)
- CTA: "Try Lagoon on TestFlight." — direct, confident, action-oriented
- Marquee updated: added Widgets + Friends & Share Cards
- Stats: 37k Gauchos, 4 dining halls, 200+ events/month, 1 app

### Conversion
- All CTAs point to `https://testflight.apple.com/join/hfmrM9K7` (public beta)
- Nav CTA is now a clickable link to TestFlight (was just a badge)
- Trust chips below hero actions: "Public beta · available now", "Native iPhone app", "iOS 17+", "Free to join"

### Product Story Additions
- Schedule section now mentions widgets explicitly in card copy
- Daily Nexus described as "native reading experience" not a feed/link dump
- Campus Happenings renamed from "Campus Events" to match app language
- Social/Friends features labeled "Coming soon" to set accurate expectations

---

## [2026-03-30] — UCSB Copy Pass + Social Section

### Added
- Social "Compare Schedules" section with CSS share card mockup
- All feature card descriptions updated with UCSB-specific location names
- Stats updated to real UCSB scale: 37k Gauchos, 200+ events/month
- Marquee updated with Widgets and Friends items

---

## [2026-03-28] — Initial Site Build

### Added
- Full landing page: hero, marquee, features bento, stats, highlight, CTA, footer
- CSS-only phone mockups (Home, Dining, Schedule screens)
- Fonts: Sora + Manrope
- TestFlight link in nav and CTA
- Scroll reveal animations
- Mobile responsive layout
- `vercel.json` with `cleanUrls: true`

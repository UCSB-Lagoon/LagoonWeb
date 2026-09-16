/**
 * Display layer for the level integer stored in user_gamification_profiles.level.
 * The mobile app owns the actual level-up rules; the web just translates an
 * integer into a display name + colour. Adjust labels here freely without
 * touching SQL.
 */
export type LevelDisplay = {
  rank: number;
  name: string;
  emoji: string;
  color: string;
};

export const LEVEL_DISPLAY: LevelDisplay[] = [
  { rank: 1, name: "Tadpole",       emoji: "🐸", color: "var(--level-1)" },
  { rank: 2, name: "Minnow",        emoji: "🐟", color: "var(--level-2)" },
  { rank: 3, name: "Dolphin",       emoji: "🐬", color: "var(--level-3)" },
  { rank: 4, name: "Sea Otter",     emoji: "🦦", color: "var(--level-4)" },
  { rank: 5, name: "Shark",         emoji: "🦈", color: "var(--level-5)" },
  { rank: 6, name: "Lagoon Legend", emoji: "👑", color: "var(--level-6)" },
];

export function levelDisplay(level: number | null | undefined): LevelDisplay {
  const lvl = Math.max(1, level ?? 1);
  return LEVEL_DISPLAY[Math.min(lvl, LEVEL_DISPLAY.length) - 1];
}

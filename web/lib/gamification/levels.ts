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
  { rank: 1, name: "Tadpole",       emoji: "🐸", color: "#a5f3fc" },
  { rank: 2, name: "Minnow",        emoji: "🐟", color: "#67e8f9" },
  { rank: 3, name: "Dolphin",       emoji: "🐬", color: "#22d3ee" },
  { rank: 4, name: "Sea Otter",     emoji: "🦦", color: "#4ade80" },
  { rank: 5, name: "Shark",         emoji: "🦈", color: "#fb7185" },
  { rank: 6, name: "Lagoon Legend", emoji: "👑", color: "#fde68a" },
];

export function levelDisplay(level: number | null | undefined): LevelDisplay {
  const lvl = Math.max(1, level ?? 1);
  return LEVEL_DISPLAY[Math.min(lvl, LEVEL_DISPLAY.length) - 1];
}

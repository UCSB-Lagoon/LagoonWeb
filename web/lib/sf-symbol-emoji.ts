// Maps the iOS app's SF Symbol identifiers (e.g. "graduationcap.circle.fill")
// to a web-renderable emoji. Badge `icon` values come straight from the iOS
// catalog, so on web we look them up — anything unmapped falls back to 🏅.

const MAP: Record<string, string> = {
  // academic / school
  "graduationcap": "🎓",
  "graduationcap.fill": "🎓",
  "graduationcap.circle": "🎓",
  "graduationcap.circle.fill": "🎓",
  "books.vertical": "📚",
  "books.vertical.fill": "📚",
  "book": "📖",
  "book.fill": "📖",
  "book.closed": "📕",
  "book.closed.fill": "📕",
  "pencil": "✏️",
  "pencil.circle": "✏️",
  "pencil.circle.fill": "✏️",

  // calendar / time
  "calendar": "📅",
  "calendar.circle": "📅",
  "calendar.circle.fill": "📅",
  "calendar.badge.clock": "🗓️",
  "calendar.badge.plus": "📆",
  "clock": "⏰",
  "clock.fill": "⏰",
  "alarm": "⏰",
  "alarm.fill": "⏰",
  "hourglass": "⌛",

  // charts / data
  "chart.bar": "📊",
  "chart.bar.fill": "📊",
  "chart.pie": "🥧",
  "chart.pie.fill": "🥧",
  "chart.line.uptrend.xyaxis": "📈",
  "chart.xyaxis.line": "📈",
  "point.topleft.down.curvedto.point.bottomright.up": "📈",
  "point.topleft.down.curvedto.point.bottomright.up.fill": "📈",

  // checkmarks / status
  "checkmark": "✅",
  "checkmark.circle": "✅",
  "checkmark.circle.fill": "✅",
  "checkmark.seal": "✅",
  "checkmark.seal.fill": "✅",
  "xmark.circle": "❌",
  "xmark.circle.fill": "❌",

  // people / social
  "person": "👤",
  "person.fill": "👤",
  "person.circle": "👤",
  "person.circle.fill": "👤",
  "person.2": "👥",
  "person.2.fill": "👥",
  "person.3": "👥",
  "person.3.fill": "👥",
  "person.crop.circle": "👤",
  "person.crop.circle.fill": "👤",
  "person.crop.circle.badge.plus": "🧑‍🤝‍🧑",
  "person.crop.circle.badge.checkmark": "✅",

  // streak / fire / energy
  "flame": "🔥",
  "flame.fill": "🔥",
  "bolt": "⚡",
  "bolt.fill": "⚡",
  "bolt.circle": "⚡",
  "bolt.circle.fill": "⚡",
  "sparkle": "✨",
  "sparkles": "✨",

  // trophies / awards
  "trophy": "🏆",
  "trophy.fill": "🏆",
  "rosette": "🏅",
  "medal": "🥇",
  "medal.fill": "🥇",
  "crown": "👑",
  "crown.fill": "👑",
  "star": "⭐",
  "star.fill": "⭐",
  "star.circle": "⭐",
  "star.circle.fill": "⭐",

  // food / dining
  "fork.knife": "🍽️",
  "fork.knife.circle": "🍽️",
  "fork.knife.circle.fill": "🍽️",
  "cup.and.saucer": "☕",
  "cup.and.saucer.fill": "☕",
  "takeoutbag.and.cup.and.straw": "🥤",

  // location / map
  "map": "🗺️",
  "map.fill": "🗺️",
  "mappin": "📍",
  "mappin.circle": "📍",
  "mappin.circle.fill": "📍",
  "location": "📍",
  "location.fill": "📍",
  "house": "🏠",
  "house.fill": "🏠",

  // misc
  "heart": "❤️",
  "heart.fill": "❤️",
  "hand.thumbsup": "👍",
  "hand.thumbsup.fill": "👍",
  "vote": "🗳️",
  "checkmark.square": "☑️",
  "trash": "🗑️",
  "envelope": "✉️",
  "envelope.fill": "✉️",
  "paperplane": "📨",
  "paperplane.fill": "📨",
  "bell": "🔔",
  "bell.fill": "🔔",
  "tag": "🏷️",
  "tag.fill": "🏷️",
  "flag": "🚩",
  "flag.fill": "🚩",
  "moon.stars": "🌙",
  "moon.stars.fill": "🌙",
  "sun.max": "☀️",
  "sun.max.fill": "☀️",
  "leaf": "🌿",
  "leaf.fill": "🌿",
  "wave.3.right": "🌊",
};

const SF_PATTERN = /^[a-z0-9]+(\.[a-z0-9]+)+$/i;

export function badgeIconToEmoji(icon: string | null | undefined, fallback = "🏅"): string {
  if (!icon) return fallback;
  const trimmed = icon.trim();
  if (!trimmed) return fallback;

  // Already an emoji or short non-SF-symbol glyph — pass through.
  if (!SF_PATTERN.test(trimmed) && trimmed.length <= 4) return trimmed;

  // Direct hit, then progressively shorter prefixes
  // (e.g. "graduationcap.circle.fill" → "graduationcap.circle" → "graduationcap").
  if (MAP[trimmed]) return MAP[trimmed];
  const parts = trimmed.split(".");
  for (let n = parts.length - 1; n >= 1; n--) {
    const key = parts.slice(0, n).join(".");
    if (MAP[key]) return MAP[key];
  }
  return fallback;
}

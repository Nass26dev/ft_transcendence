const LEAGUE_EMOJIS = [
  "🍻", "💼", "🏆", "⚽", "🔥", "🎯",
  "🦁", "🚀", "🎲", "👑", "🥇", "🍀",
];

/** Le backend ne stocke pas d'emoji pour les ligues : on en dérive un de façon
 *  déterministe à partir d'un identifiant (id ou nom) pour garder un visuel stable. */
export function leagueEmoji(seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return LEAGUE_EMOJIS[h % LEAGUE_EMOJIS.length];
}

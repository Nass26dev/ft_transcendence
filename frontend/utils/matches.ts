import type { Match } from "@/utils/types";

/** Compétitions majeures à garder dans "prochains gros matchs" / proposer en filtre. */
export const MAJOR_COMPETITIONS = [
  "Ligue 1",
  "Ligue 2",
  "Premier League",
  "Bundesliga",
  "La Liga",
  "Serie A",
  "Primeira Liga",
  "Coupe du monde",
];

const MAJOR_SET = new Set(MAJOR_COMPETITIONS);

/** Emoji associé à chaque compétition majeure (affiché dans les filtres). */
export const COMPETITION_FLAGS: Record<string, string> = {
  "Ligue 1": "🇫🇷",
  "Ligue 2": "🇫🇷",
  "Premier League": "🇬🇧",
  Bundesliga: "🇩🇪",
  "La Liga": "🇪🇸",
  "Serie A": "🇮🇹",
  "Primeira Liga": "🇵🇹",
  "Coupe du monde": "🏆",
};

/**
 * Ne garde que les matchs des championnats majeurs.
 * Correspondance exacte (sinon "Premier League" attraperait "Premier League UA").
 */
export function filterByMajorCompetitions(matches: Match[]): Match[] {
  return matches.filter((m) => m.competition != null && MAJOR_SET.has(m.competition));
}

/** Minuscule sans accents, pour une recherche tolérante (« Genève » ~ « geneve »). */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Vrai si le match correspond à la recherche `query` (équipes ou compétition).
 * Chaque mot de la requête doit matcher quelque part (recherche « ET »).
 */
export function matchMatchesQuery(match: Match, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(
    [match.home_team, match.away_team, match.competition].filter(Boolean).join(" ")
  );
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/**
 * Liste les championnats majeurs réellement présents dans `matches`,
 * dans l'ordre de MAJOR_COMPETITIONS. Sert à n'afficher que les filtres utiles.
 */
export function majorCompetitionsPresent(matches: Match[]): string[] {
  const present = new Set(
    matches
      .map((m) => m.competition)
      .filter((c): c is string => c != null)
  );
  return MAJOR_COMPETITIONS.filter((c) => present.has(c));
}

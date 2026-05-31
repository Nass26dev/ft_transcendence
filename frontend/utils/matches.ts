import type { Match } from "@/utils/types";

/** Compétitions majeures à garder dans "prochains gros matchs". */
export const MAJOR_COMPETITIONS = [
  "Ligue 1",
  "Ligue 2",
  "Premier League",
  "Bundesliga",
  "La Liga",
  "Serie A",
  "Primeira Liga",
];

/** Ne garde que les matchs des championnats majeurs. */
export function filterByMajorCompetitions(matches: Match[]): Match[] {
  return matches.filter((m) =>
    MAJOR_COMPETITIONS.some((c) => m.competition?.startsWith(c))
  );
}

import { TEAMS } from "@/data/kop-data";
import type { Match } from "@/utils/types";

/** Libellé d'un pick (1 / X / 2) pour un match donné. */
export function labelFor(k: string, m: Match): string {
  const home = m.home_team ?? TEAMS[m.home]?.n ?? m.home;
  const away = m.away_team ?? TEAMS[m.away]?.n ?? m.away;
  if (k === "1") return `${home} vainqueur`;
  if (k === "2") return `${away} vainqueur`;
  if (k === "X") return "Match nul";
  return k;
}

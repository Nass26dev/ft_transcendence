import { TEAMS } from "@/data/kop-data";
import type { Match } from "@/utils/types";

/** Libellé d'un pick (1 / X / 2) pour un match donné. */
export function labelFor(k: string, m: Match): string {
  if (k === "1") return `${TEAMS[m.home].n} vainqueur`;
  if (k === "2") return `${TEAMS[m.away].n} vainqueur`;
  if (k === "X") return "Match nul";
  return k;
}

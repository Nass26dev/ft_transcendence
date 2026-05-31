import { TEAMS, LEAGUES, MATCHES, LIVE } from "@/data/kop-data";
import type { Match, League, Team } from "@/utils/types";

export type FormResult = "W" | "D" | "L";

export interface MarketOption {
  k: string;
  label: string;
  v: number;
}

export interface Market {
  ttl: string;
  count: number;
  opts: MarketOption[];
}

export interface MatchDetail {
  match: Match;
  lg: League;
  home: Team;
  away: Team;
  isLive: boolean;
  markets: Market[];
  homeForm: FormResult[];
  awayForm: FormResult[];
}

/** Construit le view-model d'une page match à partir de son id (null si introuvable). */
export function buildMatchDetail(matchId: string): MatchDetail | null {
  const match = [...MATCHES, ...LIVE].find((m) => m.id === matchId);
  if (!match) return null;

  const lg = LEAGUES[match.league];
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  const isLive = !!match.minute;

  const markets: Market[] = [
    {
      ttl: "Vainqueur du match",
      count: 3,
      opts: [
        { k: "1", label: home.n, v: match.odds["1"] },
        { k: "X", label: "Match nul", v: match.odds["X"] },
        { k: "2", label: away.n, v: match.odds["2"] },
      ],
    },
    {
      ttl: "Total de buts",
      count: 2,
      opts: [
        { k: "O25", label: "Plus de 2.5", v: 1.85 },
        { k: "U25", label: "Moins de 2.5", v: 1.95 },
      ],
    },
    {
      ttl: "Les deux équipes marquent",
      count: 2,
      opts: [
        { k: "BTTSY", label: "Oui", v: 1.75 },
        { k: "BTTSN", label: "Non", v: 2.05 },
      ],
    },
    {
      ttl: "Score exact (sélection)",
      count: 3,
      opts: [
        { k: "21", label: "2 − 1", v: 8.5 },
        { k: "10", label: "1 − 0", v: 7.0 },
        { k: "11", label: "1 − 1", v: 6.5 },
      ],
    },
  ];

  const homeForm: FormResult[] = ["W", "W", "D", "L", "W"];
  const awayForm: FormResult[] = ["L", "W", "W", "W", "D"];

  return { match, lg, home, away, isLive, markets, homeForm, awayForm };
}

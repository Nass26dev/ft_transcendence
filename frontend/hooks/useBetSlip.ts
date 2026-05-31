"use client";

import { useState } from "react";
import { TEAMS } from "@/data/kop-data";
import { labelFor } from "@/utils/bets";
import type { Match, SlipPick, PlacePayload, Toast } from "@/utils/types";

/** État et actions du ticket de paris (picks, solde, slip, toast). */
export function useBetSlip() {
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [balance, setBalance] = useState<number>(10000);
  const [slipOpen, setSlipOpen] = useState<boolean>(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const handlePick = (match: Match, k: string, customLabel?: string) => {
    const odd = match.odds?.[k as "1" | "X" | "2"];
    if (typeof odd !== "number") return; // cote indisponible : pas de pick

    setPicks((prev) => {
      const existing = prev.find((p) => p.matchId === match.id);
      const id = `${match.id}-${k}`;

      if (existing && existing.k === k) {
        return prev.filter((p) => p.matchId !== match.id);
      }

      const filtered = prev.filter((p) => p.matchId !== match.id);
      const home = match.home_team ?? TEAMS[match.home]?.sh ?? match.home;
      const away = match.away_team ?? TEAMS[match.away]?.sh ?? match.away;
      return [
        ...filtered,
        {
          id,
          matchId: match.id,
          k,
          game: `${home} vs ${away}`,
          label: customLabel || labelFor(k, match),
          odd,
        },
      ];
    });
    setSlipOpen(true);
  };

  const isPicked = (mId: string, k: string): boolean =>
    picks.some((p) => p.matchId === mId && p.k === k);

  const removePick = (id: string) =>
    setPicks((prev) => prev.filter((p) => p.id !== id));

  const clearPicks = () => setPicks([]);

  const handlePlace = ({ stake, payout }: PlacePayload) => {
    setBalance((b) => b - stake);
    setPicks([]);
    setToast({
      type: "ok",
      msg: `Pari placé · ${stake.toLocaleString("fr-FR")} K en jeu, ${payout.toLocaleString("fr-FR")} K potentiels`,
    });
    setTimeout(() => setToast(null), 4000);
  };

  return {
    picks,
    balance,
    slipOpen,
    setSlipOpen,
    toast,
    handlePick,
    isPicked,
    removePick,
    clearPicks,
    handlePlace,
  };
}

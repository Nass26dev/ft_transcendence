"use client";

import { useState } from "react";
import api from "@/utils/api";
import { TEAMS } from "@/data/kop-data";
import { labelFor } from "@/utils/bets";
import type { Match, SlipPick, PlacePayload, Toast } from "@/utils/types";

/** État et actions du ticket de paris (pari simple : 1 pick à la fois).
 *  `onPlaced` est appelé après un pari réussi (ex: rafraîchir le wallet). */
export function useBetSlip(onPlaced?: () => void) {
  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [slipOpen, setSlipOpen] = useState<boolean>(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  };

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

  const handlePlace = async ({ stake, payout }: PlacePayload) => {
    const pick = picks[0];
    if (!pick) return;

    try {
      await api.post("/api/betting/", {
        match: Number(pick.matchId),
        selection: pick.k,
        stake,
      });
      setPicks([]);
      onPlaced?.();
      showToast({
        type: "ok",
        msg: `Pari placé · ${stake.toLocaleString("fr-FR")} K en jeu, ${payout.toLocaleString("fr-FR")} K potentiels`,
      });
    } catch (err: unknown) {
      const response =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { status?: number; data?: Record<string, unknown> } })
              .response
          : undefined;

      // Pas (ou plus) connecté : il faut s'authentifier pour parier.
      if (response?.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = response?.data;
      const msg =
        (data && (data.stake || data.detail || Object.values(data)[0])) ??
        "Impossible de placer le pari.";
      showToast({ type: "err", msg: String(msg) });
    }
  };

  return {
    picks,
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

"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { Bet } from "@/utils/types";

/** Forme brute renvoyée par GET /api/betting/. */
interface ApiBet {
  id: number;
  match: number;
  stake: string;
  odd_value: string;
  potential_win: string;
  pick: string;
  home_team: string;
  away_team: string;
  status: "pending" | "won" | "lost" | "cancelled";
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Mappe un pari API vers le view-model Bet utilisé par les TicketCard. */
function toBet(b: ApiBet): Bet {
  const odd = Number(b.odd_value);
  const status = b.status === "cancelled" ? "lost" : b.status;
  return {
    id: String(b.id),
    date: formatDate(b.created_at),
    kind: "Simple",
    stake: Number(b.stake),
    payout: Number(b.potential_win),
    odd,
    status,
    picks: [
      {
        match: `${b.home_team} vs ${b.away_team}`,
        pick: b.pick,
        odd,
        status,
      },
    ],
  };
}

/** Charge les paris de l'utilisateur connecté. */
export function useBets() {
  const { isAuthenticated, ready } = useProfile();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!ready) return; // on attend de savoir si l'utilisateur est connecté
    if (!isAuthenticated) {
      setBets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<ApiBet[]>("/api/betting/")
      .then((res) => setBets(res.data.map(toBet)))
      .catch((err) => console.error("Erreur chargement paris:", err))
      .finally(() => setLoading(false));
  }, [ready, isAuthenticated]);

  return { bets, loading };
}

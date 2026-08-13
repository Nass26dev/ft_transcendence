"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { Bet } from "@/utils/types";

/** Une jambe renvoyée par l'API. */
interface ApiPick {
  match: string;
  pick: string;
  odd: number;
  status: "pending" | "won" | "lost" | "cancelled";
}

/** Forme brute renvoyée par GET /api/betting/. */
interface ApiBet {
  id: number;
  stake: string;
  odd_value: string;
  potential_win: string;
  kind: string;
  picks: ApiPick[];
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

/** cancelled est affiché comme "lost" côté UI (pas de statut dédié). */
const uiStatus = (s: ApiPick["status"]) => (s === "cancelled" ? "lost" : s);

/** Mappe un pari API vers le view-model Bet utilisé par les TicketCard. */
function toBet(b: ApiBet): Bet {
  return {
    id: String(b.id),
    date: formatDate(b.created_at),
    kind: b.kind,
    stake: Number(b.stake),
    payout: Number(b.potential_win),
    odd: Number(b.odd_value),
    status: uiStatus(b.status),
    picks: b.picks.map((p) => ({
      match: p.match,
      pick: p.pick,
      odd: p.odd,
      status: uiStatus(p.status),
    })),
  };
}

/** Charge les paris de l'utilisateur connecté. */
export function useBets() {
  const { isAuthenticated, ready } = useProfile();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!ready) return;
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

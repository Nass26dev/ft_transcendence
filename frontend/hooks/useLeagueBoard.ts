"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { ApiLeagueBoard } from "@/utils/types";

/** Classement Kops des membres d'une ligue donnée (null tant qu'aucune ligue). */
export function useLeagueBoard(leagueId: number | null) {
  const { isAuthenticated, ready } = useProfile();
  const [board, setBoard] = useState<ApiLeagueBoard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (id: number) => {
    try {
      const res = await api.get<ApiLeagueBoard>(`/api/league/${id}/leaderboard/`);
      setBoard(res.data);
    } catch (err) {
      console.error("Erreur chargement classement ligue:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || leagueId == null) {
      setBoard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    load(leagueId);
  }, [ready, isAuthenticated, leagueId, load]);

  return { board, loading };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { ApiChallenge } from "@/utils/types";

/** Défis quotidiens + saison de l'utilisateur, avec récupération des récompenses. */
export function useChallenges() {
  const { isAuthenticated, ready, refreshProfile } = useProfile();
  const [daily, setDaily] = useState<ApiChallenge[]>([]);
  const [season, setSeason] = useState<ApiChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/challenges/");
      setDaily(res.data.daily ?? []);
      setSeason(res.data.season ?? []);
    } catch (err) {
      console.error("Erreur chargement défis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setDaily([]);
      setSeason([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [ready, isAuthenticated, load]);

  /** Récupère la récompense d'un défi, met à jour les défis et le solde. */
  const claim = useCallback(
    async (code: string) => {
      await api.post(`/api/challenges/${code}/claim/`);
      await Promise.all([load(), refreshProfile()]);
    },
    [load, refreshProfile],
  );

  return { daily, season, loading, claim, reload: load };
}

"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import type { Match } from "@/utils/types";

/** Charge tous les matchs à venir (hors live), toutes compétitions confondues. */
export function useUpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get("/api/matches/upcoming/");
        if (!cancelled) setMatches(res.data);
      } catch (err) {
        if (!cancelled) console.error("Erreur chargement matchs:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { matches, loading };
}

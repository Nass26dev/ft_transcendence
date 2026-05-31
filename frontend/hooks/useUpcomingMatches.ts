"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import type { Match } from "@/utils/types";

/** Charge tous les matchs à venir (hors live), toutes compétitions confondues. */
export function useUpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/matches/upcoming/");
        setMatches(res.data);
      } catch (err) {
        console.error("Erreur chargement matchs:", err);
      }
    };
    load();
  }, []);

  return { matches };
}

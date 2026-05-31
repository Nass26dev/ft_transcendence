"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import type { Match } from "@/utils/types";

/** Charge le détail d'un match par son id. */
export function useMatchDetail(id: string) {
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await api.get(`/api/matches/${id}/`);
        setMatch(res.data);
      } catch (err) {
        console.error("Erreur chargement détail match:", err);
      }
    };
    load();
  }, [id]);

  return { match };
}

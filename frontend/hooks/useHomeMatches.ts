"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { filterByMajorCompetitions } from "@/utils/matches";
import type { Match } from "@/utils/types";

/** Charge les matchs live + à venir (filtrés sur les championnats majeurs).
 *  On privilégie les grands championnats, mais hors saison (aucun match
 *  majeur à venir) on retombe sur les autres matchs pour ne pas avoir une home vide. */
export function useHomeMatches() {
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.all([
          api.get("/api/matches/live/"),
          api.get("/api/matches/upcoming/"),
        ]);
        if (cancelled) return;
        setLive(liveRes.data);
        const major = filterByMajorCompetitions(upcomingRes.data);
        setUpcoming(major.length > 0 ? major : upcomingRes.data);
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

  return { live, upcoming, loading };
}

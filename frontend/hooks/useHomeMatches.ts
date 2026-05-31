"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { filterByMajorCompetitions } from "@/utils/matches";
import type { Match } from "@/utils/types";

/** Charge les matchs live + à venir (filtrés sur les championnats majeurs). */
export function useHomeMatches() {
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.all([
          api.get("/api/matches/live/"),
          api.get("/api/matches/upcoming/"),
        ]);

        setLive(liveRes.data);
        setUpcoming(filterByMajorCompetitions(upcomingRes.data));
      } catch (err) {
        console.error("Erreur chargement matchs:", err);
      }
    };
    load();
  }, []);

  return { live, upcoming };
}

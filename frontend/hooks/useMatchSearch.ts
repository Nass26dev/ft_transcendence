"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/utils/types";
import { matchMatchesQuery } from "@/utils/matches";

/**
 * Recherche de matchs par équipe ou compétition.
 * Renvoie la requête, son setter et la liste filtrée (à passer ensuite au
 * filtre par championnat pour combiner les deux).
 */
export function useMatchSearch(matches: Match[]) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      query.trim()
        ? matches.filter((m) => matchMatchesQuery(m, query))
        : matches,
    [matches, query]
  );

  return { query, setQuery, filtered };
}

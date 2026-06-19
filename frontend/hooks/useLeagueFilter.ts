"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/utils/types";
import { majorCompetitionsPresent } from "@/utils/matches";

/**
 * Filtre une liste de matchs par championnat majeur.
 * - `leagues` : championnats majeurs réellement présents (pour n'afficher que des filtres utiles).
 * - `active === null` : tous les matchs.
 * - Si la ligue active disparaît au rechargement des données, on retombe sur "Tous".
 */
export function useLeagueFilter(matches: Match[]) {
  const [active, setActive] = useState<string | null>(null);

  const leagues = useMemo(() => majorCompetitionsPresent(matches), [matches]);

  const effectiveActive = active && leagues.includes(active) ? active : null;

  const filtered = useMemo(
    () =>
      effectiveActive
        ? matches.filter((m) => m.competition === effectiveActive)
        : matches,
    [matches, effectiveActive]
  );

  return { filtered, leagues, active: effectiveActive, setActive };
}

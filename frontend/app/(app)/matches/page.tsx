"use client";

import React from "react";

import { useUpcomingMatches } from "@/hooks/useUpcomingMatches";
import { useLeagueFilter } from "@/hooks/useLeagueFilter";
import { useMatchSearch } from "@/hooks/useMatchSearch";
import { useBetSlipHandlers } from "../_components/BetSlipProvider";
import { LeagueFilterBar } from "@/components/match/LeagueFilterBar";
import { MatchSearchBar } from "@/components/match/MatchSearchBar";
import { MatchesList } from "./_components/MatchesList";

const PAGE_SIZE = 60;

/**
 * Page listant tous les matchs à venir, avec recherche et filtre par championnat.
 * Affichage progressif par pages de PAGE_SIZE (rendre toutes les cartes d'un coup
 * fige la page) ; la recherche/le filtre travaillent sur l'ensemble des matchs et
 * réinitialisent le nombre affiché pour repartir du haut de la nouvelle liste.
 */
export default function MatchesPage() {
  const { matches, loading } = useUpcomingMatches();
  const handlers = useBetSlipHandlers();
  const { query, setQuery, filtered: searched } = useMatchSearch(matches);
  const { filtered, leagues, active, setActive } = useLeagueFilter(searched);

  const [visible, setVisible] = React.useState(PAGE_SIZE);
  React.useEffect(() => setVisible(PAGE_SIZE), [query, active]);

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Tous les matches
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            Football · {loading ? "…" : `${filtered.length} matches disponibles`}
          </div>
        </div>
      </div>

      <MatchSearchBar
        value={query}
        onChange={setQuery}
        className="mb-4 max-w-[480px]"
      />

      {!loading && (
        <LeagueFilterBar
          leagues={leagues}
          active={active}
          onChange={setActive}
          className="mb-4"
        />
      )}

      <MatchesList matches={shown} loading={loading} {...handlers} />

      {!loading && remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-[10px] border border-border bg-surface-1 px-5 py-2.5 text-[13px] font-semibold text-text-2 transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-text"
          >
            Voir plus ({remaining} match{remaining > 1 ? "es" : ""} restants)
          </button>
        </div>
      )}
    </div>
  );
}

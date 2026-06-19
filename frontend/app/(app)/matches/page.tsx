"use client";

import React from "react";

import { useUpcomingMatches } from "@/hooks/useUpcomingMatches";
import { useLeagueFilter } from "@/hooks/useLeagueFilter";
import { useBetSlipHandlers } from "../_components/BetSlipProvider";
import { LeagueFilterBar } from "@/components/match/LeagueFilterBar";
import { MatchesList } from "./_components/MatchesList";

export default function MatchesPage() {
  const { matches, loading } = useUpcomingMatches();
  const handlers = useBetSlipHandlers();
  const { filtered, leagues, active, setActive } = useLeagueFilter(matches);

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* Header */}
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

      {!loading && (
        <LeagueFilterBar
          leagues={leagues}
          active={active}
          onChange={setActive}
          className="mb-4"
        />
      )}

      <MatchesList matches={filtered} loading={loading} {...handlers} />
    </div>
  );
}

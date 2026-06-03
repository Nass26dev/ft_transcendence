"use client";

import React from "react";

import { useUpcomingMatches } from "@/hooks/useUpcomingMatches";
import { useBetSlipHandlers } from "../_components/BetSlipProvider";
import { MatchesList } from "./_components/MatchesList";

export default function MatchesPage() {
  const { matches } = useUpcomingMatches();
  const handlers = useBetSlipHandlers();

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Tous les matches
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            Football · {matches.length} matches disponibles
          </div>
        </div>
      </div>

      <MatchesList matches={matches} {...handlers} />
    </div>
  );
}

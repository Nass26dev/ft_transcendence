"use client";

import React from "react";
import type { Match, PickHandlers } from "@/utils/types";
import { OddsRow } from "@/components/match/OddsRow";
import { TeamBadge } from "@/components/match/TeamBadge";
import { formatKickoff } from "@/utils/date";

interface MatchHeroProps extends PickHandlers {
  match: Match;
}

export function MatchHero({ match, onPick, isPicked }: MatchHeroProps) {
  return (
    <div className="rounded-[12px] border border-border bg-surface-1 p-6">
      {/* Meta */}
      <div className="mb-5 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
        <span className="text-text-2">{match.competition}</span>
        {match.kickoff_at && (
          <>
            <span className="text-text-4">•</span>
            <span>{formatKickoff(match.kickoff_at, "long")}</span>
          </>
        )}
      </div>

      {/* Teams + odds */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-6">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2.5 text-lg font-bold">
            <TeamBadge team={match.home_team} side="home" size={26} />
            {match.home_team}
          </span>
          <span className="flex items-center gap-2.5 text-lg font-bold">
            <TeamBadge team={match.away_team} side="away" size={26} />
            {match.away_team}
          </span>
        </div>
        <OddsRow match={match} onPick={onPick} isPicked={isPicked} />
      </div>
    </div>
  );
}

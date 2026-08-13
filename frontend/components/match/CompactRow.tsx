"use client";

import React from "react";
import type { Match, MatchHandlers } from "@/utils/types";
import { OddsRow } from "@/components/match/OddsRow";
import { TeamBadge } from "@/components/match/TeamBadge";
import { useCardOpen } from "@/hooks/useCardOpen";
import { splitKickoff } from "@/utils/date";

interface CompactRowProps extends MatchHandlers {
  match: Match;
}

/** Ligne compacte d'un match (liste "à venir" sur /live) : heure, équipes et cotes. */
export function CompactRow({ match, onPick, isPicked, onOpen }: CompactRowProps) {
  const [day, time] = splitKickoff(match.kickoff_at ?? match.kickoff);
  const handleClick = useCardOpen(match.id, onOpen);

  return (
    <div
      onClick={handleClick}
      className="flex cursor-pointer flex-col gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2 sm:grid sm:grid-cols-[88px_1fr_auto] sm:items-center sm:gap-4"
    >
      <div className="flex items-baseline gap-1.5 font-mono text-xs font-semibold text-text-3 sm:block">
        <span className="text-text-2 sm:block">{day}</span>
        {time}
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
          {match.competition}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <TeamBadge team={match.home_team} side="home" logo={match.home_team_logo} color={match.home_team_color} size={18} />
            {match.home_team}
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <TeamBadge team={match.away_team} side="away" logo={match.away_team_logo} color={match.away_team_color} size={18} />
            {match.away_team}
          </span>
        </div>
      </div>

      <OddsRow
        match={match}
        onPick={onPick}
        isPicked={isPicked}
        className="flex gap-1.5 [&>*]:flex-1 sm:[&>*]:flex-none"
      />
    </div>
  );
}

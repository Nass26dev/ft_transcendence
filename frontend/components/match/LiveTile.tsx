"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { TeamBadge } from "@/components/match/TeamBadge";
import { OddsRow } from "@/components/match/OddsRow";
import { useCardOpen } from "@/hooks/useCardOpen";
import type { Match, PickHandlers } from "@/utils/types";

interface LiveTileProps extends PickHandlers {
  match: Match;
}

/** Tuile d'un match en direct : minute/score en évidence et cotes en pleine largeur. */
export function LiveTile({ match, onPick, isPicked, onOpen }: LiveTileProps) {
  const handleClick = useCardOpen(match.id, onOpen);

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer overflow-hidden rounded-[10px] border border-border bg-gradient-to-br from-[#2A0808] to-surface-1 p-4 transition-colors hover:border-kop"
    >
      <div className="flex items-center justify-between">
        <Tag kind="live">
          {match.current_minute != null ? `${match.current_minute}'` : "LIVE"}
        </Tag>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
          {match.competition}
        </span>
      </div>

      <div className="my-3 flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamBadge team={match.home_team} side="home" logo={match.home_team_logo} color={match.home_team_color} size={20} />
          <span className="truncate text-sm font-semibold">{match.home_team}</span>
        </div>
        <div className="flex-none px-2 font-display tnum text-2xl font-bold tracking-[-0.02em]">
          {match.home_score ?? 0} − {match.away_score ?? 0}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold">{match.away_team}</span>
          <TeamBadge team={match.away_team} side="away" logo={match.away_team_logo} color={match.away_team_color} size={20} />
        </div>
      </div>

      <OddsRow match={match} onPick={onPick} isPicked={isPicked} fullWidth />
    </div>
  );
}
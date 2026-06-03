"use client";

import React from "react";
import { Crest } from "@/components/ui/Crest";
import { Tag } from "@/components/ui/Tag";
import type { Match, PickHandlers } from "@/utils/types";
import { OddPill } from "@/components/ui/OddPill";

interface LiveTileProps extends PickHandlers {
  match: Match;
}

export function LiveTile({ match, onPick, isPicked, onOpen }: LiveTileProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("[data-odd-pill]")) {
      onOpen(match.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer overflow-hidden rounded-[10px] border border-border bg-gradient-to-br from-[#2A0808] to-surface-1 p-4 transition-colors hover:border-kop"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Tag kind="live">
          {match.current_minute != null ? `${match.current_minute}'` : "LIVE"}
        </Tag>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
          {match.competition}
        </span>
      </div>

      {/* Score */}
      <div className="my-3 flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-semibold">{match.home_team}</span>
        </div>
        <div className="flex-none px-2 font-display tnum text-2xl font-bold tracking-[-0.02em]">
          {match.home_score ?? 0} − {match.away_score ?? 0}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold">{match.away_team}</span>
        </div>
      </div>

      {/* Odds */}
      <div className="flex gap-1.5">
        {(["1", "X", "2"] as const).map((k) => (
          <OddPill
            key={k}
            label={k}
            value={match.odds?.[k]}
            selected={isPicked(match.id, k)}
            onClick={() => onPick(match, k)}
            fullWidth
          />
        ))}
      </div>
    </div>
  );
}
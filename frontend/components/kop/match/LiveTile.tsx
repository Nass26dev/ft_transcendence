"use client";

import React from "react";
import { Crest } from "@/components/kop/ui/Crest";
import { Tag } from "@/components/kop/ui/Tag";
import { TEAMS, LEAGUES } from "@/data/kop-data";
import type { Match, PickHandlers } from "@/utils/types";
import { OddPill } from "./OddPill";

interface LiveTileProps extends PickHandlers {
  match: Match;
}

export function LiveTile({ match, onPick, isPicked, onOpen }: LiveTileProps) {
  const lg = (LEAGUES as any)[match.league];

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
        <Tag kind="live">{match.minute}&apos;</Tag>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
          {lg.n}
        </span>
      </div>

      {/* Score */}
      <div className="my-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crest team={match.home} size={32} />
          <span className="text-sm font-semibold">
            {(TEAMS as any)[match.home].n}
          </span>
        </div>
        <div className="font-display tnum text-2xl font-bold tracking-[-0.02em]">
          {match.scoreH} − {match.scoreA}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {(TEAMS as any)[match.away].n}
          </span>
          <Crest team={match.away} size={32} />
        </div>
      </div>

      {/* Odds */}
      <div className="flex gap-1.5">
        {(["1", "X", "2"] as const).map((k) => (
          <OddPill
            key={k}
            label={k}
            value={match.odds[k]}
            selected={isPicked(match.id, k)}
            onClick={() => onPick(match, k)}
            fullWidth
          />
        ))}
      </div>
    </div>
  );
}
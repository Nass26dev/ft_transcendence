"use client";

import React from "react";
import { Crest } from "@/components/ui/Crest";
import { TEAMS, LEAGUES } from "@/data/kop-data";
import type { Match, MatchHandlers } from "@/utils/types";
import { OddPill } from "@/components/ui/OddPill";

interface CompactRowProps extends MatchHandlers {
  match: Match;
}

export function CompactRow({ match, onPick, isPicked, onOpen }: CompactRowProps) {
  const lg = LEAGUES[match.league];
  const [day, time] = match.kickoff.split(" ");

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("[data-odd-pill]")) {
      onOpen(match.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="grid grid-cols-[88px_1fr_auto] cursor-pointer items-center gap-4 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
    >
      {/* Heure */}
      <div className="font-mono text-xs font-semibold text-text-3">
        <span className="block text-text-2">{day}</span>
        {time}
      </div>

      {/* Ligue + équipes */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
          {lg.flag} {lg.n}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Crest team={match.home} size={22} />
            <span className="text-sm font-semibold">{TEAMS[match.home].n}</span>
          </div>
          <div className="flex items-center gap-2">
            <Crest team={match.away} size={22} />
            <span className="text-sm font-semibold">{TEAMS[match.away].n}</span>
          </div>
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
          />
        ))}
      </div>
    </div>
  );
}
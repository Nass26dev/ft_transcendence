"use client";

import React from "react";
import type { Match, MatchHandlers } from "@/utils/types";
import { OddPill } from "@/components/ui/OddPill";

interface CompactRowProps extends MatchHandlers {
  match: Match;
}

function splitKickoff(iso: string): [string, string] {
  if (!iso) return ["", ""];
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return [day, time];
}

export function CompactRow({ match, onPick, isPicked, onOpen }: CompactRowProps) {
  const [day, time] = splitKickoff(match.kickoff_at ?? match.kickoff);

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

      {/* Compétition + équipes */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
          {match.competition}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{match.home_team}</span>
          <span className="text-sm font-semibold">{match.away_team}</span>
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
            trend={match.trend?.[k] as "up" | "down" | undefined}
            onClick={() => onPick(match, k)}
          />
        ))}
      </div>
    </div>
  );
}

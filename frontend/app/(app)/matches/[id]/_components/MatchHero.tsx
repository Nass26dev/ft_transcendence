"use client";

import React from "react";
import type { Match, PickHandlers } from "@/utils/types";
import { OddPill } from "@/components/ui/OddPill";

interface MatchHeroProps extends PickHandlers {
  match: Match;
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
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
            <span>{formatKickoff(match.kickoff_at)}</span>
          </>
        )}
      </div>

      {/* Teams + odds */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-bold">{match.home_team}</span>
          <span className="text-lg font-bold">{match.away_team}</span>
        </div>
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
    </div>
  );
}

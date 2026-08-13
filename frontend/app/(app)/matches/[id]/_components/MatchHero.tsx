"use client";

import React from "react";
import type { Match, PickHandlers } from "@/utils/types";
import { OddsRow } from "@/components/match/OddsRow";
import { TeamBadge } from "@/components/match/TeamBadge";
import { formatKickoff } from "@/utils/date";

interface MatchHeroProps extends PickHandlers {
  match: Match;
}

/** Petite pastille d'info (ex. stade, arbitre) avec un libellé et une valeur. */
function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-text-2">
      <span className="text-text-3">{label}</span>
      {value}
    </span>
  );
}

/**
 * Bandeau principal d'un match : compétition, équipes (domicile — score — extérieur),
 * minute en direct, score à la mi-temps, cotes et infos complémentaires (stade, arbitre).
 */
export function MatchHero({ match, onPick, isPicked }: MatchHeroProps) {
  const hasScore =
    typeof match.home_score === "number" && typeof match.away_score === "number";
  const isLive = match.status === "live";
  const hasHt =
    typeof match.ht_home_score === "number" &&
    typeof match.ht_away_score === "number";

  return (
    <div className="rounded-[12px] border border-border bg-surface-1 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
        <span className="text-text-2">{match.competition}</span>
        {match.stage && (
          <>
            <span className="text-text-4">•</span>
            <span>{match.stage}</span>
          </>
        )}
        {match.kickoff_at && (
          <>
            <span className="text-text-4">•</span>
            <span>{formatKickoff(match.kickoff_at, "long")}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamBadge team={match.home_team} side="home" logo={match.home_team_logo} color={match.home_team_color} size={28} />
          <span className="truncate text-base font-bold sm:text-lg">
            {match.home_team}
          </span>
        </div>

        <div className="flex flex-col items-center">
          {hasScore ? (
            <span className="tnum text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
              {match.home_score} <span className="text-text-4">:</span>{" "}
              {match.away_score}
            </span>
          ) : (
            <span className="text-sm font-semibold text-text-3">vs</span>
          )}
          {isLive && match.current_minute != null && (
            <span className="mt-0.5 rounded bg-kop px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-white">
              {match.current_minute}&apos;
            </span>
          )}
          {hasHt && (
            <span className="mt-1 text-[11px] font-medium text-text-3">
              MT {match.ht_home_score}-{match.ht_away_score}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
          <span className="truncate text-base font-bold sm:text-lg">
            {match.away_team}
          </span>
          <TeamBadge team={match.away_team} side="away" logo={match.away_team_logo} color={match.away_team_color} size={28} />
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <OddsRow match={match} onPick={onPick} isPicked={isPicked} />
      </div>

      {(match.venue || match.referee) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-border pt-4">
          {match.venue && <InfoChip label="Stade" value={match.venue} />}
          {match.referee && <InfoChip label="Arbitre" value={match.referee} />}
        </div>
      )}
    </div>
  );
}

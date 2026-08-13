"use client";

import React from "react";
import type { Match, PickHandlers } from "@/utils/types";
import { OddsRow } from "@/components/match/OddsRow";
import { TeamBadge } from "@/components/match/TeamBadge";
import { useCardOpen } from "@/hooks/useCardOpen";
import { formatKickoff } from "@/utils/date";

interface MatchCardProps extends PickHandlers {
  match: Match;
}

export const MatchCard = React.memo(function MatchCard({
  match,
  onPick,
  isPicked,
  onOpen,
}: MatchCardProps) {
  const conf = match.conf ?? { "1": 0, X: 0, "2": 0 };
  const hasBets = (match.bets_total ?? 0) > 0;
  const handleClick = useCardOpen(match.id, onOpen);

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-[10px] border border-border bg-surface-1 px-4.5 py-4 transition-all hover:-translate-y-px hover:border-border-strong"
    >
      {/* Meta */}
      <div className="mb-3.5 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
        <span className="text-text-2">{match.competition}</span>
        <span className="text-text-4">•</span>
        <span>{formatKickoff(match.kickoff_at ?? "")}</span>
      </div>

      {/* Teams + odds */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-3.5">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <TeamBadge team={match.home_team} side="home" />
            <span className="truncate">{match.home_team}</span>
          </span>
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <TeamBadge team={match.away_team} side="away" />
            <span className="truncate">{match.away_team}</span>
          </span>
        </div>
        <OddsRow match={match} onPick={onPick} isPicked={isPicked} />
      </div>

      {/* Confidence */}
      <div className="mt-3.5">
        <div className="mb-1 flex justify-between text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
          <span>Confiance des Kopistes</span>
          {hasBets && (
            <span>
              {match.bets_total} pari{(match.bets_total ?? 0) > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {hasBets ? (
          <>
            <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-surface-3">
              <div
                className="h-full bg-kop transition-[width] duration-300"
                style={{ width: `${conf["1"]}%` }}
              />
              <div
                className="h-full bg-text-4 transition-[width] duration-300"
                style={{ width: `${conf["X"]}%` }}
              />
              <div
                className="h-full bg-blue transition-[width] duration-300"
                style={{ width: `${conf["2"]}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] font-semibold text-text-3">
              <span>{conf["1"]} % · {match.home_team}</span>
              <span>{conf["X"]} % · Nul</span>
              <span>{conf["2"]} % · {match.away_team}</span>
            </div>
          </>
        ) : (
          <div className="rounded-[3px] bg-surface-2 px-2.5 py-2 text-[11px] font-medium text-text-3">
            Aucun pari pour l&apos;instant. Sois le premier Kopiste à te lancer.
          </div>
        )}
      </div>
    </div>
  );
});
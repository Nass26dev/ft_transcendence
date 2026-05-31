"use client";

import React from "react";
import { MatchCard } from "@/components/match/MatchCard";
import type { Match, MatchHandlers } from "@/utils/types";

interface MatchesListProps extends MatchHandlers {
  matches: Match[];
}

export function MatchesList({
  matches,
  onPick,
  isPicked,
  onOpen,
}: MatchesListProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {matches.length === 0 ? (
        <div className="col-span-2 rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
          Aucun match à venir dans les grands championnats.
        </div>
      ) : (
        matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            onPick={onPick}
            isPicked={isPicked}
            onOpen={onOpen}
          />
        ))
      )}
    </div>
  );
}

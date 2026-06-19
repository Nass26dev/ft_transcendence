"use client";

import React from "react";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchCardSkeleton } from "@/components/match/MatchSkeleton";
import type { Match, MatchHandlers } from "@/utils/types";

interface MatchesListProps extends MatchHandlers {
  matches: Match[];
  loading?: boolean;
}

export function MatchesList({
  matches,
  loading,
  onPick,
  isPicked,
  onOpen,
}: MatchesListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {matches.length === 0 ? (
        <div className="col-span-full rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
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

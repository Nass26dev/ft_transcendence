"use client";

import React from "react";
import { CompactRow } from "@/components/match/CompactRow";
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
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
      {matches.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-3">
          Aucun match dans cette ligue pour le moment.
        </div>
      ) : (
        matches.map((m) => (
          <CompactRow
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

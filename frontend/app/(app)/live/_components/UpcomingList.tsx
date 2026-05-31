"use client";

import React from "react";
import { CompactRow } from "@/components/match/CompactRow";
import type { Match, MatchHandlers } from "@/utils/types";

interface UpcomingListProps extends MatchHandlers {
  matches: Match[];
}

export function UpcomingList({
  matches,
  onPick,
  isPicked,
  onOpen,
}: UpcomingListProps) {
  return (
    <>
      {/* À venir */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            À venir aujourd&apos;hui
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
        {matches.map((m) => (
          <CompactRow
            key={m.id}
            match={m}
            onPick={onPick}
            isPicked={isPicked}
            onOpen={onOpen}
          />
        ))}
      </div>
    </>
  );
}

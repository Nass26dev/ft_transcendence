"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { LiveTile } from "@/components/match/LiveTile";
import { LeagueFilterBar } from "@/components/match/LeagueFilterBar";
import { MatchCardSkeletonGrid } from "@/components/match/MatchSkeleton";
import { useLeagueFilter } from "@/hooks/useLeagueFilter";
import type { Match, MatchHandlers } from "@/utils/types";

interface LiveGridProps extends MatchHandlers {
  matches: Match[];
  loading?: boolean;
}

export function LiveGrid({ matches, loading, onPick, isPicked, onOpen }: LiveGridProps) {
  const { filtered, leagues, active, setActive } = useLeagueFilter(matches);

  return (
    <>
      {/* Header */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.02em]">
            En direct <Tag kind="live">{loading ? "…" : `${filtered.length} matchs`}</Tag>
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            Les cotes pulsent quand elles bougent. Sois rapide.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mb-6">
          <MatchCardSkeletonGrid count={4} />
        </div>
      ) : (
        <>
          <LeagueFilterBar
            leagues={leagues}
            active={active}
            onChange={setActive}
            className="mb-4"
          />

          {/* Live tiles */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((m) => (
              <LiveTile
                key={m.id}
                match={m}
                onPick={onPick}
                isPicked={isPicked}
                onOpen={onOpen}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

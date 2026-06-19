"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { LiveTile } from "@/components/match/LiveTile";
import { LeagueFilterBar } from "@/components/match/LeagueFilterBar";
import { MatchSearchBar } from "@/components/match/MatchSearchBar";
import { MatchCardSkeletonGrid } from "@/components/match/MatchSkeleton";
import { useLeagueFilter } from "@/hooks/useLeagueFilter";
import { useMatchSearch } from "@/hooks/useMatchSearch";
import type { Match, MatchHandlers } from "@/utils/types";

interface LiveGridProps extends MatchHandlers {
  matches: Match[];
  loading?: boolean;
}

export function LiveGrid({ matches, loading, onPick, isPicked, onOpen }: LiveGridProps) {
  const { query, setQuery, filtered: searched } = useMatchSearch(matches);
  const { filtered, leagues, active, setActive } = useLeagueFilter(searched);

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

      <MatchSearchBar
        value={query}
        onChange={setQuery}
        className="mb-4 max-w-[480px]"
      />

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

          {filtered.length === 0 ? (
            <div className="mb-6 rounded-[10px] border border-border bg-surface-1 px-4 py-8 text-center text-[13px] text-text-3">
              Aucun match en direct ne correspond.
            </div>
          ) : (
            /* Live tiles */
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
          )}
        </>
      )}
    </>
  );
}

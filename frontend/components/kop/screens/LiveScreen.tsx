"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { LiveTile } from "@/components/match/LiveTile";
import { CompactRow } from "@/components/match/CompactRow";
import { LIVE, MATCHES } from "@/data/kop-data";
import type { MatchHandlers } from "@/utils/types";

export function LiveScreen({ onPick, isPicked, onOpen }: MatchHandlers) {
  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* Header */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.02em]">
            En direct <Tag kind="live">{LIVE.length} matchs</Tag>
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            Les cotes pulsent quand elles bougent. Sois rapide.
          </div>
        </div>
      </div>

      {/* Live tiles */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {LIVE.map((m) => (
          <LiveTile
            key={m.id}
            match={m}
            onPick={onPick}
            isPicked={isPicked}
            onOpen={onOpen}
          />
        ))}
      </div>

      {/* À venir */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            À venir aujourd&apos;hui
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
        {MATCHES.slice(0, 5).map((m) => (
          <CompactRow
            key={m.id}
            match={m}
            onPick={onPick}
            isPicked={isPicked}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}
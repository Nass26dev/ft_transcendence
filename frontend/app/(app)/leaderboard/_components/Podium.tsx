import React from "react";
import { Kops } from "@/components/ui/Kops";
import { getPodiumColor } from "@/utils/styles";
import type { LeagueBoardEntry } from "@/utils/types";

/** Podium des 3 premiers du classement, affiché au-dessus du tableau complet. */
export function Podium({ entries }: { entries: LeagueBoardEntry[] }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
      {entries.map((r) => (
        <div
          key={r.rank}
          className={`min-w-0 rounded-[10px] border bg-gradient-to-b to-surface-1 p-3 sm:p-4 ${getPodiumColor(r.rank)}`}
        >
          <div className="mb-3 flex items-center justify-between gap-1">
            <span className="font-display text-2xl font-bold sm:text-3xl">
              {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}
            </span>
            <span className="font-mono tnum text-[11px] font-bold text-text-3 sm:text-xs">
              WR {r.wr}
            </span>
          </div>
          <div className="mb-1 truncate text-sm font-bold">{r.user}</div>
          <div className="mb-3 truncate text-xs text-text-3">{r.handle}</div>
          <Kops amount={r.kops} size={16} color="var(--green)" />
        </div>
      ))}
    </div>
  );
}

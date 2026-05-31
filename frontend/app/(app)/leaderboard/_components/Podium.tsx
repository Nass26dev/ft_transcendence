import React from "react";
import { Kops } from "@/components/ui/Kops";
import { getPodiumColor } from "@/utils/styles";
import type { LeagueBoardEntry } from "@/utils/types";

export function Podium({ entries }: { entries: LeagueBoardEntry[] }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      {entries.map((r) => (
        <div
          key={r.rank}
          className={`rounded-[10px] border bg-gradient-to-b to-surface-1 p-4 ${getPodiumColor(r.rank)}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-3xl font-bold">
              {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}
            </span>
            <span className="font-mono tnum text-xs font-bold text-text-3">
              WR {r.wr}
            </span>
          </div>
          <div className="mb-1 text-sm font-bold">{r.user}</div>
          <div className="mb-3 text-xs text-text-3">{r.handle}</div>
          <Kops amount={r.kops} size={16} color="var(--green)" />
        </div>
      ))}
    </div>
  );
}

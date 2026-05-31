import React from "react";
import type { LeagueCardData } from "@/utils/types";

const AVATAR_COLORS = ["#FF6B6B", "#4A8DFF", "#A3FF12", "#FFD60A", "#C9184A"];

export function MyLeagueCard({ l }: { l: LeagueCardData }) {
  return (
    <div
      className={[
        "rounded-[10px] border bg-surface-1 p-4.5",
        l.mine ? "border-kop" : "border-border",
      ].join(" ")}
    >
      <div className="mb-2.5 text-[28px]">{l.emoji}</div>
      <div className="mb-1.5 font-display text-lg font-bold">{l.n}</div>
      <div className="mb-3.5 text-xs text-text-3">
        {l.d} membres · saison {l.w}
      </div>
      <div className="flex items-center">
        {AVATAR_COLORS.map((c, j) => (
          <div
            key={j}
            className="h-[26px] w-[26px] rounded-full border-2 border-surface-1"
            style={{ background: c, marginLeft: j > 0 ? -8 : 0 }}
          />
        ))}
        {l.d > 5 && (
          <span className="ml-2 text-xs text-text-3">+{l.d - 5}</span>
        )}
      </div>
    </div>
  );
}

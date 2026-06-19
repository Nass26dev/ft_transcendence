import React from "react";
import { getRoiColor, getWrBarColor } from "@/utils/styles";
import { COMPETITIONS } from "@/data/kop-data";
import type { CompetitionStat } from "@/utils/types";

function CompetitionRow({
  s,
  isLast,
}: {
  s: CompetitionStat;
  isLast: boolean;
}) {
  return (
    <div
      className={[
        "grid grid-cols-[1fr_auto_auto_auto] items-center gap-2.5 py-3 sm:grid-cols-[1fr_80px_80px_1fr_90px] sm:gap-3.5",
        isLast ? "" : "border-b border-border",
      ].join(" ")}
    >
      <div className="min-w-0 truncate text-sm font-semibold">
        {s.flag} {s.lg}
      </div>
      <div className="font-mono tnum text-[13px] text-text-2">
        {s.bets} paris
      </div>
      <div className="font-mono tnum text-[13px] font-bold">{s.wr} %</div>
      <div className="hidden h-1 overflow-hidden rounded-[2px] bg-surface-3 sm:block">
        <div
          className={`h-full rounded-[2px] ${getWrBarColor(s.wr)}`}
          style={{ width: `${s.wr}%` }}
        />
      </div>
      <div
        className={`text-right font-mono tnum text-sm font-bold ${getRoiColor(s.roi)}`}
      >
        {s.roi}
      </div>
    </div>
  );
}

export function CompetitionsCard() {
  return (
    <div className="flex-[2] rounded-[10px] border border-border bg-surface-1 p-5.5">
      <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em]">
        Performance par compétition
      </h3>
      {COMPETITIONS.map((s, i) => (
        <CompetitionRow key={i} s={s} isLast={i === COMPETITIONS.length - 1} />
      ))}
    </div>
  );
}

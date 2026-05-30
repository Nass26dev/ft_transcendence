import React from "react";

const STATS = [
  ["Forme (5 derniers)", "8 pts", "7 pts"],
  ["Buts marqués / match", "2.4", "1.8"],
  ["Buts encaissés / match", "0.9", "1.3"],
  ["Confrontations directes", "6 V", "2 V"],
] as const;

export function MatchStats() {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-5">
      <h3 className="mb-3 font-display text-base font-bold">Stats clés</h3>
      {STATS.map(([lbl, h, a], i, arr) => (
        <div
          key={i}
          className={[
            "flex items-center justify-between py-2 text-[13px]",
            i < arr.length - 1 ? "border-b border-border" : "",
          ].join(" ")}
        >
          <span className="min-w-[36px] text-left font-mono tnum font-bold">
            {h}
          </span>
          <span className="flex-1 text-center text-[11.5px] text-text-3">
            {lbl}
          </span>
          <span className="min-w-[36px] text-right font-mono tnum font-bold">
            {a}
          </span>
        </div>
      ))}
    </div>
  );
}

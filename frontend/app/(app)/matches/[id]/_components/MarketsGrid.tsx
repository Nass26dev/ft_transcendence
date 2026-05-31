"use client";

import React from "react";
import type { Match } from "@/utils/types";
import type { MatchDetail } from "@/utils/matchDetail";

interface MarketsGridProps {
  detail: MatchDetail;
  onPick: (match: Match, k: string, customLabel?: string) => void;
  isPicked: (matchId: string, k: string) => boolean;
}

export function MarketsGrid({ detail, onPick, isPicked }: MarketsGridProps) {
  const { match, markets } = detail;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Marchés
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          {markets.length} catégories · 24 cotes
        </div>
      </div>

      <div className="grid gap-3">
        {markets.map((m, i) => (
          <div
            key={i}
            className="rounded-[10px] border border-border bg-surface-1"
          >
            <div className="flex items-center justify-between px-4.5 py-3.5">
              <span className="text-sm font-semibold">{m.ttl}</span>
              <span className="text-[11.5px] font-medium text-text-3">
                {m.count} options
              </span>
            </div>
            <div
              className={`grid gap-2.5 px-4.5 pb-4.5 ${
                m.count === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {m.opts.map((o) => (
                <div
                  key={o.k}
                  data-odd-pill
                  onClick={() =>
                    onPick(
                      {
                        ...match,
                        odds: { ...match.odds, [o.k]: o.v } as Match["odds"],
                      },
                      o.k,
                      o.label,
                    )
                  }
                  className={[
                    "flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3.5 transition-all",
                    isPicked(match.id, o.k)
                      ? "border-kop-bright bg-kop text-white shadow-[0_0_0_1px_var(--kop-bright),0_6px_18px_-6px_var(--kop)]"
                      : "border-border bg-surface-2 hover:border-kop hover:text-text",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-[11.5px] font-semibold uppercase tracking-[0.05em]",
                      isPicked(match.id, o.k) ? "text-white/75" : "text-text-3",
                    ].join(" ")}
                  >
                    {o.label}
                  </span>
                  <span className="font-mono tnum text-[15px] font-bold">
                    {o.v.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

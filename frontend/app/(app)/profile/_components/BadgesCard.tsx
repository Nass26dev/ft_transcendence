import React from "react";
import { BADGES } from "@/data/kop-data";
import type { Badge } from "@/utils/types";

function BadgeCard({ b }: { b: Badge }) {
  return (
    <div
      className={[
        "rounded-lg bg-surface-2 p-3 text-center",
        b.locked ? "opacity-45" : "",
      ].join(" ")}
    >
      <div className="mb-1 text-2xl">{b.e}</div>
      <div className="text-[11px] font-bold">{b.n}</div>
      <div className="mt-0.5 text-[10px] text-text-3">{b.d}</div>
    </div>
  );
}

export function BadgesCard() {
  return (
    <div className="flex-1 rounded-[10px] border border-border bg-surface-1 p-5.5">
      <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em]">
        Badges
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {BADGES.map((b, i) => (
          <BadgeCard key={i} b={b} />
        ))}
      </div>
    </div>
  );
}

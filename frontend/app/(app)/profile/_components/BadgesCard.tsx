"use client";

import React from "react";
import { useBadges } from "@/hooks/useBadges";
import type { ApiBadge } from "@/utils/types";

function BadgeCard({ b }: { b: ApiBadge }) {
  return (
    <div
      className={[
        "rounded-lg bg-surface-2 p-3 text-center",
        b.unlocked ? "" : "opacity-45",
      ].join(" ")}
    >
      <div className="mb-1 text-2xl">{b.unlocked ? b.emoji : "🔒"}</div>
      <div className="text-[11px] font-bold">{b.name}</div>
      <div className="mt-0.5 text-[10px] text-text-3">{b.description}</div>
    </div>
  );
}

export function BadgesCard() {
  const { badges } = useBadges();

  return (
    <div className="flex-1 rounded-[10px] border border-border bg-surface-1 p-5.5">
      <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em]">Badges</h3>
      {badges.length === 0 ? (
        <div className="text-[13px] text-text-3">Aucun badge pour l&apos;instant.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {badges.map((b) => (
            <BadgeCard key={b.code} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}

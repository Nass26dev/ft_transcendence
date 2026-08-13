"use client";

import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { useBets } from "@/hooks/useBets";

/**
 * Statistiques clés du joueur (taux de réussite, total, série, plus gros gain).
 * La série en cours compte les victoires consécutives parmi les paris réglés,
 * en partant du plus récent, et s'arrête à la première défaite rencontrée.
 */
export function ProfileStats() {
  const { bets } = useBets();

  const won = bets.filter((b) => b.status === "won");
  const lost = bets.filter((b) => b.status === "lost");
  const settledCount = won.length + lost.length;

  const winRate = settledCount ? Math.round((won.length / settledCount) * 100) : 0;
  const biggestWin = won.reduce((m, b) => Math.max(m, b.payout), 0);

  let streak = 0;
  for (const b of bets) {
    if (b.status === "pending") continue;
    if (b.status === "won") streak += 1;
    else break;
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
      <StatCard
        label="Taux de réussite"
        value={`${winRate} %`}
        delta={`${settledCount} pari${settledCount > 1 ? "s" : ""} réglé${settledCount > 1 ? "s" : ""}`}
      />
      <StatCard
        label="Paris totaux"
        value={String(bets.length)}
        delta={`${won.length} gagné${won.length > 1 ? "s" : ""}`}
        deltaKind="up"
      />
      <StatCard
        label="Série actuelle"
        value={`${streak} V`}
        delta={streak > 0 ? "↑ En cours" : "-"}
        deltaKind={streak > 0 ? "up" : "muted"}
      />
      <StatCard
        label="Plus gros gain"
        value={biggestWin ? biggestWin.toLocaleString("fr-FR") : "-"}
        valueKind="green"
        delta="Kops"
      />
    </div>
  );
}

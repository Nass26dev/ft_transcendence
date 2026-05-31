import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import type { Bet } from "@/utils/types";

export function TicketsStats({ bets }: { bets: Bet[] }) {
  const pending = bets.filter((b) => b.status === "pending");
  const settled = bets.filter((b) => b.status !== "pending");
  const won = bets.filter((b) => b.status === "won");

  const inPlay = pending.reduce((s, b) => s + b.stake, 0);
  const potential = pending.reduce((s, b) => s + b.payout, 0);
  const winRate = settled.length
    ? Math.round((won.length / settled.length) * 100)
    : 0;

  return (
    <div className="mb-6 grid grid-cols-4 gap-3.5">
      <StatCard
        label="Tickets en cours"
        value={String(pending.length)}
        delta={`${inPlay.toLocaleString("fr-FR")} K en jeu`}
        deltaKind="muted"
      />
      <StatCard
        label="Gain potentiel"
        value={potential.toLocaleString("fr-FR")}
        valueKind="green"
        delta="sur paris en cours"
        deltaKind="muted"
      />
      <StatCard
        label="Win rate"
        value={`${winRate} %`}
        delta={`${settled.length} paris réglés`}
        deltaKind="muted"
      />
      <StatCard
        label="Paris totaux"
        value={String(bets.length)}
        delta={`${won.length} gagnés`}
        deltaKind="muted"
      />
    </div>
  );
}

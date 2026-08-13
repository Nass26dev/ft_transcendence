import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import type { Bet } from "@/utils/types";

/** Résumé chiffré des paris du joueur : en cours, gain potentiel, taux de réussite, total. */
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
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
      <StatCard
        label="Paris en cours"
        value={String(pending.length)}
        delta={`${inPlay.toLocaleString("fr-FR")} K en jeu`}
        deltaKind="muted"
      />
      <StatCard
        label="Gain potentiel"
        value={potential.toLocaleString("fr-FR")}
        valueKind="green"
        delta="sur les paris en cours"
        deltaKind="muted"
      />
      <StatCard
        label="Taux de réussite"
        value={`${winRate} %`}
        delta={`${settled.length} pari${settled.length > 1 ? "s" : ""} réglé${settled.length > 1 ? "s" : ""}`}
        deltaKind="muted"
      />
      <StatCard
        label="Paris totaux"
        value={String(bets.length)}
        delta={`${won.length} gagné${won.length > 1 ? "s" : ""}`}
        deltaKind="muted"
      />
    </div>
  );
}

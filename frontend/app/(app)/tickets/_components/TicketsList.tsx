import React from "react";
import { TicketCard } from "@/components/betting/TicketCard";
import type { Bet } from "@/utils/types";

/** Liste de tickets de paris, ou message vide si la catégorie ne contient aucun pari. */
export function TicketsList({ bets }: { bets: Bet[] }) {
  if (bets.length === 0) {
    return (
      <div className="rounded-[10px] border border-border bg-surface-1 p-8 text-center text-sm text-text-3">
        Aucun pari dans cette catégorie.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bets.map((b) => (
        <TicketCard key={b.id} bet={b} />
      ))}
    </div>
  );
}

"use client";

import React from "react";
import { useBets } from "@/hooks/useBets";
import { TicketsStats } from "./_components/TicketsStats";
import { TicketsTabs, type TabKey } from "./_components/TicketsTabs";
import { TicketsList } from "./_components/TicketsList";

export default function TicketsPage() {
  const { bets, loading } = useBets();
  const [tab, setTab] = React.useState<TabKey>("pending");

  const filtered =
    tab === "all" ? bets : bets.filter((b) => b.status === tab);

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Mes paris
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Historique complet de tes paris
        </div>
      </div>

      <TicketsStats bets={bets} />

      <TicketsTabs tab={tab} onTab={setTab} />

      {loading ? (
        <div className="rounded-[10px] border border-border bg-surface-1 p-8 text-center text-sm text-text-3">
          Chargement de tes paris…
        </div>
      ) : (
        <TicketsList bets={filtered} />
      )}
    </div>
  );
}

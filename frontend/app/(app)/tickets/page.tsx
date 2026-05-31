"use client";

import React from "react";
import { MY_BETS } from "@/data/kop-data";
import { TicketsStats } from "./_components/TicketsStats";
import { TicketsTabs, type TabKey } from "./_components/TicketsTabs";
import { TicketsList } from "./_components/TicketsList";

export default function TicketsPage() {
  const [tab, setTab] = React.useState<TabKey>("pending");

  const filtered =
    tab === "all" ? MY_BETS : MY_BETS.filter((b) => b.status === tab);

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* Header */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Mes paris
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Historique complet de tes tickets
        </div>
      </div>

      <TicketsStats />

      <TicketsTabs tab={tab} onTab={setTab} />

      <TicketsList bets={filtered} />
    </div>
  );
}

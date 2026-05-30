"use client";

import React from "react";
import { TicketCard } from "@/components/kop/match/TicketCard";
import { MY_BETS } from "@/data/kop-data";
import type { BetStatus } from "@/utils/types";
import { StatCard } from "@/components/ui/StatCard";


type TabKey = BetStatus | "all";

interface Tab {
  id: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { id: "pending", label: "En cours" },
  { id: "won", label: "Gagnés" },
  { id: "lost", label: "Perdus" },
  { id: "all", label: "Tous" },
];

export function TicketsScreen() {
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

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3.5">
        <StatCard
          label="Tickets en cours"
          value="1"
          delta="200 K en jeu"
          deltaKind="muted"
        />
        <StatCard
          label="Gain potentiel"
          value="1 620"
          valueKind="green"
          delta="×8.10 cote"
          deltaKind="up"
        />
        <StatCard
          label="Win rate"
          value="54 %"
          delta="+3 % cette sem."
          deltaKind="up"
        />
        <StatCard
          label="ROI"
          value="+12.4 %"
          valueKind="green"
          delta="+850 K ce mois"
          deltaKind="up"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "-mb-px cursor-pointer px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors",
                isActive
                  ? "border-kop text-text"
                  : "border-transparent text-text-3 hover:text-text-2",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-surface-1 p-8 text-center text-sm text-text-3">
          Aucun pari dans cette catégorie.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <TicketCard key={b.id} bet={b} />
          ))}
        </div>
      )}
    </div>
  );
}
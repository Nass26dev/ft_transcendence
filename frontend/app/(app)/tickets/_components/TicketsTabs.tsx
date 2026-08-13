"use client";

import React from "react";
import type { BetStatus } from "@/utils/types";

/** Onglet actif de la page tickets : un statut de pari donné, ou "all" pour tous les paris. */
export type TabKey = BetStatus | "all";

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

/** Barre d'onglets pour filtrer les tickets par statut (en cours, gagnés, perdus, tous). */
export function TicketsTabs({
  tab,
  onTab,
}: {
  tab: TabKey;
  onTab: (tab: TabKey) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 border-b border-border">
      {TABS.map((t) => {
        const isActive = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
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
  );
}

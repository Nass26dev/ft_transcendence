"use client";

import React from "react";

export type TabKey = "all" | "L1" | "UCL" | "PL";

interface Tab {
  id: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { id: "all", label: "Tous" },
  { id: "L1", label: "🇫🇷 Ligue 1" },
  { id: "UCL", label: "⭐ Champions League" },
  { id: "PL", label: "🇬🇧 Premier League" },
];

export function MatchesTabs({
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

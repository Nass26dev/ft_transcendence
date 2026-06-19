"use client";

import React from "react";

export type PeriodKey = "week" | "month" | "season" | "all";

const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "season", label: "Saison" },
  { id: "all", label: "Tous temps" },
];

export function PeriodTabs({
  period,
  onPeriod,
}: {
  period: PeriodKey;
  onPeriod: (period: PeriodKey) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {PERIODS.map((p) => {
        const isActive = period === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onPeriod(p.id)}
            className={[
              "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors",
              isActive
                ? "bg-surface-3 text-text"
                : "bg-surface-2 text-text-3 hover:bg-surface-3 hover:text-text-2",
            ].join(" ")}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

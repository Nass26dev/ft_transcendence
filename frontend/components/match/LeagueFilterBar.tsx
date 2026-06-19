"use client";

import React from "react";
import { COMPETITION_FLAGS } from "@/utils/matches";

interface LeagueFilterBarProps {
  /** Championnats majeurs présents (cf. useLeagueFilter). */
  leagues: string[];
  /** Ligue active, ou null pour "Tous". */
  active: string | null;
  onChange: (league: string | null) => void;
  className?: string;
}

/** Barre de filtres par championnat. Ne s'affiche pas s'il n'y a aucune ligue majeure. */
export function LeagueFilterBar({
  leagues,
  active,
  onChange,
  className = "",
}: LeagueFilterBarProps) {
  if (leagues.length === 0) return null;

  const chip = (key: string | null, label: string) => {
    const isActive = active === key;
    return (
      <button
        key={key ?? "__all__"}
        onClick={() => onChange(key)}
        className={[
          "cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
          isActive
            ? "border-kop/40 bg-kop/15 text-kop-bright"
            : "border-border bg-surface-1 text-text-3 hover:border-border-strong hover:text-text-2",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={["flex flex-wrap items-center gap-2", className].join(" ")}>
      {chip(null, "Tous")}
      {leagues.map((lg) =>
        chip(lg, `${COMPETITION_FLAGS[lg] ?? ""} ${lg}`.trim())
      )}
    </div>
  );
}

"use client";

import React from "react";
import { OddPill } from "@/components/ui/OddPill";
import type { Match, MatchHandlers } from "@/utils/types";

interface OddsRowProps {
  match: Match;
  onPick: MatchHandlers["onPick"];
  isPicked: MatchHandlers["isPicked"];
  /** Pills étirées (tuiles live). */
  fullWidth?: boolean;
  /** Classes du conteneur (par défaut une rangée simple). */
  className?: string;
}

/** Rangée de cotes 1 / N / 2 d'un match (partagée par toutes les vues). */
export function OddsRow({
  match,
  onPick,
  isPicked,
  fullWidth = false,
  className = "flex gap-1.5",
}: OddsRowProps) {
  return (
    <div className={className}>
      {(["1", "X", "2"] as const).map((k) => (
        <OddPill
          key={k}
          label={k}
          value={match.odds?.[k]}
          selected={isPicked(match.id, k)}
          trend={match.trend?.[k] as "up" | "down" | undefined}
          onClick={() => onPick(match, k)}
          fullWidth={fullWidth}
        />
      ))}
    </div>
  );
}

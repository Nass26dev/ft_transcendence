"use client";

import React from "react";
import { TEAMS } from "@/data/kop-data";
import type { Team } from "@/utils/types";

interface CrestProps {
  team: string;
  size?: number;
}

export function Crest({ team, size = 28 }: CrestProps) {
  const t = (TEAMS as Record<string, Team>)[team];
  if (!t) return null;

  return (
    <div
      className="team-crest"
      style={{
        width: size,
        height: size,
        flexBasis: size,
        background: t.c,
        color: t.t,
        fontSize: size * 0.36,
        border: t.c === "#FFFFFF" ? "1px solid var(--border)" : "none",
      }}
    >
      {t.sh.slice(0, 3)}
    </div>
  );
}
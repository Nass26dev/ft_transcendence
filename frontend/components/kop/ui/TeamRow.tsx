"use client";

import React from "react";
import { TEAMS } from "@/data/kop-data";
import type { Team } from "@/utils/types";
import { Crest } from "./Crest";

interface TeamRowProps {
  team: string;
  score?: number | null;
}

export function TeamRow({ team, score = null }: TeamRowProps) {
  const t = (TEAMS as Record<string, Team>)[team];
  if (!t) return null;

  return (
    <div className="team-row">
      <Crest team={team} />
      <span style={{ flex: 1 }}>{t.n}</span>
      {score !== null && (
        <span className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
          {score}
        </span>
      )}
    </div>
  );
}
"use client";

import React from "react";
import { CHALLENGES, SEASON_CHALLENGES } from "@/data/kop-data";
import { DailyChallengeRow } from "./_components/DailyChallengeRow";
import { SeasonChallengeCard } from "./_components/SeasonChallengeCard";

export default function ChallengesPage() {
  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* ============= DAILY ============= */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Défis du jour
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Réinit. à 00h00 · accumule des Kops bonus
        </div>
      </div>

      <div className="mb-7 flex flex-col gap-2.5">
        {CHALLENGES.map((c) => (
          <DailyChallengeRow key={c.id} c={c} />
        ))}
      </div>

      {/* ============= SEASON ============= */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Saison 2025/26
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Récompenses long terme
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        {SEASON_CHALLENGES.map((c, i) => (
          <SeasonChallengeCard key={i} c={c} />
        ))}
      </div>
    </div>
  );
}

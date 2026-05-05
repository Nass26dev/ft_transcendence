"use client";

import React from "react";
import { Kops } from "@/components/kop/ui/Kops";
import { CHALLENGES } from "@/data/kop-data";
import type { Challenge } from "@/utils/types";

// ---------- Data ----------

interface SeasonChallenge {
  ttl: string;
  desc: string;
  progress: number;
  total: number;
  reward: number;
}

const SEASON_CHALLENGES: SeasonChallenge[] = [
  {
    ttl: "Premier combiné gagnant",
    desc: "Termine un combiné x3 ou plus",
    progress: 0,
    total: 1,
    reward: 5000,
  },
  {
    ttl: "Streak hot",
    desc: "10 paris gagnants d'affilée",
    progress: 4,
    total: 10,
    reward: 10000,
  },
  {
    ttl: "Roi de la Ligue 1",
    desc: "Top 3 d'une ligue privée 4 sem.",
    progress: 1,
    total: 4,
    reward: 25000,
  },
];

// ---------- Sub-components ----------

function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = Math.min(100, (progress / total) * 100);
  return (
    <div className="h-1 overflow-hidden rounded-[2px] bg-surface-3">
      <div
        className="h-full rounded-[2px] bg-green transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DailyChallengeRow({ c }: { c: Challenge }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[10px] border border-border bg-surface-1 p-3.5">
      <div className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border border-border bg-surface-2 text-[22px]">
        {c.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{c.ttl}</div>
        <div className="mt-0.5 text-xs text-text-3">{c.desc}</div>
        <div className="mt-2">
          <ProgressBar progress={c.progress} total={c.total} />
        </div>
        <div className="mt-1.5 text-[11px] text-text-3">
          {c.progress} / {c.total}
        </div>
      </div>

      <div className="flex-none text-right">
        <div className="font-display text-base font-bold text-green">
          +{c.reward}
        </div>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-3">
          Kops
        </div>
      </div>
    </div>
  );
}

function SeasonChallengeCard({ c }: { c: SeasonChallenge }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4.5">
      <div className="mb-1 text-[13px] font-semibold">{c.ttl}</div>
      <div className="mb-3.5 text-xs text-text-3">{c.desc}</div>
      <ProgressBar progress={c.progress} total={c.total} />
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] text-text-3">
          {c.progress} / {c.total}
        </span>
        <Kops amount={c.reward} size={13} color="var(--green)" />
      </div>
    </div>
  );
}

// ---------- Component ----------

export function ChallengesScreen() {
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
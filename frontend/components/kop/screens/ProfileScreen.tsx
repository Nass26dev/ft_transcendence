"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { StatCard } from "@/components/ui/StatCard";

// ---------- Data ----------

interface CompetitionStat {
  lg: string;
  flag: string;
  bets: number;
  wr: number;
  roi: string;
}

const COMPETITIONS: CompetitionStat[] = [
  { lg: "Ligue 1", flag: "🇫🇷", bets: 64, wr: 58, roi: "+18.2 %" },
  { lg: "Champions League", flag: "⭐", bets: 31, wr: 52, roi: "+8.4 %" },
  { lg: "Premier League", flag: "🇬🇧", bets: 28, wr: 46, roi: "−4.1 %" },
  { lg: "La Liga", flag: "🇪🇸", bets: 24, wr: 54, roi: "+12.0 %" },
];

interface Badge {
  e: string;
  n: string;
  d: string;
  locked?: boolean;
}

const BADGES: Badge[] = [
  { e: "🎯", n: "Sniper", d: "10 paris simples gagnés" },
  { e: "🔥", n: "En feu", d: "Streak de 5" },
  { e: "⭐", n: "C1 expert", d: "20 paris UCL" },
  { e: "🍻", n: "Mardi soir", d: "Top 3 ligue privée" },
  { e: "🦅", n: "Lyon city", d: "Supporter local" },
  { e: "🔒", n: "???", d: "À débloquer", locked: true },
];

// ---------- Sub-components ----------

function CompetitionRow({
  s,
  isLast,
}: {
  s: CompetitionStat;
  isLast: boolean;
}) {
  const isNeg = s.roi.startsWith("-") || s.roi.startsWith("−");

  return (
    <div
      className={[
        "grid grid-cols-[1fr_80px_80px_1fr_90px] items-center gap-3.5 py-3",
        isLast ? "" : "border-b border-border",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">
        {s.flag} {s.lg}
      </div>
      <div className="font-mono tnum text-[13px] text-text-2">
        {s.bets} paris
      </div>
      <div className="font-mono tnum text-[13px] font-bold">{s.wr} %</div>
      <div className="h-1 overflow-hidden rounded-[2px] bg-surface-3">
        <div
          className={`h-full rounded-[2px] ${s.wr >= 50 ? "bg-green" : "bg-kop"}`}
          style={{ width: `${s.wr}%` }}
        />
      </div>
      <div
        className={[
          "text-right font-mono tnum text-sm font-bold",
          isNeg ? "text-kop-bright" : "text-green",
        ].join(" ")}
      >
        {s.roi}
      </div>
    </div>
  );
}

function BadgeCard({ b }: { b: Badge }) {
  return (
    <div
      className={[
        "rounded-lg bg-surface-2 p-3 text-center",
        b.locked ? "opacity-45" : "",
      ].join(" ")}
    >
      <div className="mb-1 text-2xl">{b.e}</div>
      <div className="text-[11px] font-bold">{b.n}</div>
      <div className="mt-0.5 text-[10px] text-text-3">{b.d}</div>
    </div>
  );
}

// ---------- Component ----------

export function ProfileScreen() {
  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* ============= HERO ============= */}
      <div className="mb-6 rounded-[10px] border border-border bg-gradient-to-br from-[#1A0808] to-surface-1 p-7">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="grid h-20 w-20 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[28px] font-bold">
            YO
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">
              Yohann Lefèvre
            </h1>
            <div className="mt-1 text-[13px] text-text-3">
              @you · Membre depuis sept. 2025
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag kind="green">Niveau 12 · Pronostiqueur</Tag>
              <Tag>Lyon, FR</Tag>
              <Tag>3 ligues</Tag>
            </div>
          </div>

          {/* Balance */}
          <div className="flex-none text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
              Solde
            </div>
            <div className="font-display tnum text-4xl font-bold text-kop-bright">
              52 300
            </div>
            <div className="text-xs text-text-3">Kops</div>
          </div>
        </div>
      </div>

      {/* ============= STATS ============= */}
      <div className="mb-6 grid grid-cols-4 gap-3.5">
        <StatCard
          label="Win rate"
          value="54 %"
          delta="+3 % cette sem."
          deltaKind="up"
        />
        <StatCard
          label="Paris totaux"
          value="147"
          delta="22 cette sem."
          deltaKind="muted"
        />
        <StatCard
          label="Streak actuelle"
          value="3 V"
          delta="↑ Continue"
          deltaKind="up"
        />
        <StatCard
          label="Plus gros gain"
          value="8 420"
          valueKind="green"
          delta="×16.84 il y a 2 sem."
          deltaKind="muted"
        />
      </div>

      {/* ============= MAIN ROW ============= */}
      <div className="flex items-start gap-4">
        {/* Performance par compétition */}
        <div className="flex-[2] rounded-[10px] border border-border bg-surface-1 p-5.5">
          <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em]">
            Performance par compétition
          </h3>
          {COMPETITIONS.map((s, i) => (
            <CompetitionRow
              key={i}
              s={s}
              isLast={i === COMPETITIONS.length - 1}
            />
          ))}
        </div>

        {/* Badges */}
        <div className="flex-1 rounded-[10px] border border-border bg-surface-1 p-5.5">
          <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.02em]">
            Badges
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {BADGES.map((b, i) => (
              <BadgeCard key={i} b={b} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
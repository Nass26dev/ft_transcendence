"use client";

import React from "react";
import { Kops } from "@/components/ui/Kops";
import { LEAGUE_BOARD } from "@/data/kop-data";
import type { LeagueBoardEntry } from "@/utils/types";

// ---------- Filters ----------

type ScopeKey = "world" | "france" | "lyon" | "friends";
type PeriodKey = "week" | "month" | "season" | "all";

const SCOPES: { id: ScopeKey; label: string }[] = [
  { id: "world", label: "🌍 Monde" },
  { id: "france", label: "🇫🇷 France" },
  { id: "lyon", label: "🦁 Lyon" },
  { id: "friends", label: "👥 Amis" },
];

const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "season", label: "Saison" },
  { id: "all", label: "Tous temps" },
];

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4A8DFF",
  "#A3FF12",
  "#FFD60A",
  "#C9184A",
  "#5F1E92",
  "#2FAEE0",
  "#E11A22",
];

// ---------- Sub ----------

function LeaderboardRow({
  r,
  avatarColor,
}: {
  r: LeagueBoardEntry;
  avatarColor: string;
}) {
  const rankColor =
    r.rank === 1
      ? "text-yellow"
      : r.rank === 2
        ? "text-[#C5C9D1]"
        : r.rank === 3
          ? "text-[#D88B5C]"
          : "text-text-2";

  const deltaColor = r.weekDelta.startsWith("-")
    ? "text-kop-bright"
    : "text-green";

  return (
    <div
      className={[
        "grid grid-cols-[50px_1fr_100px_100px_110px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
        r.me ? "border-l-[3px] border-l-kop bg-kop/5 pl-[13px]" : "",
      ].join(" ")}
    >
      <span className={`font-display text-lg font-bold ${rankColor}`}>
        {r.rank}
      </span>

      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-bold"
          style={{
            background: avatarColor,
            color:
              avatarColor === "#FFD60A" || avatarColor === "#A3FF12"
                ? "#000"
                : "#fff",
          }}
        >
          {r.user[0]}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.user}</div>
          <div className="truncate text-[11.5px] text-text-3">{r.handle}</div>
        </div>
      </div>

      <span className="text-right font-mono tnum text-[13px] font-semibold">
        {r.wr}
      </span>
      <span
        className={`text-right font-mono tnum text-[13px] font-semibold ${deltaColor}`}
      >
        {r.weekDelta}
      </span>
      <span className="text-right">
        <Kops amount={r.kops} size={13} />
      </span>
    </div>
  );
}

// ---------- Component ----------

export function LeaderboardScreen() {
  const [scope, setScope] = React.useState<ScopeKey>("world");
  const [period, setPeriod] = React.useState<PeriodKey>("week");

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Classement
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Les meilleurs Kopistes de la plateforme
        </div>
      </div>

      {/* Filtres scope */}
      <div className="mb-3 flex gap-1 border-b border-border">
        {SCOPES.map((s) => {
          const isActive = scope === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              className={[
                "-mb-px cursor-pointer px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors",
                isActive
                  ? "border-kop text-text"
                  : "border-transparent text-text-3 hover:text-text-2",
              ].join(" ")}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Période */}
      <div className="mb-4 flex gap-1.5">
        {PERIODS.map((p) => {
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
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

      {/* Podium top 3 */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {LEAGUE_BOARD.slice(0, 3).map((r) => {
          const podiumColor =
            r.rank === 1
              ? "from-yellow/20 border-yellow/40"
              : r.rank === 2
                ? "from-[#C5C9D1]/20 border-[#C5C9D1]/40"
                : "from-[#D88B5C]/20 border-[#D88B5C]/40";

          return (
            <div
              key={r.rank}
              className={`rounded-[10px] border bg-gradient-to-b to-surface-1 p-4 ${podiumColor}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-3xl font-bold">
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}
                </span>
                <span className="font-mono tnum text-xs font-bold text-text-3">
                  WR {r.wr}
                </span>
              </div>
              <div className="mb-1 text-sm font-bold">{r.user}</div>
              <div className="mb-3 text-xs text-text-3">{r.handle}</div>
              <Kops amount={r.kops} size={16} color="var(--green)" />
            </div>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
        <div className="grid grid-cols-[50px_1fr_100px_100px_110px] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
          <span>#</span>
          <span>Joueur</span>
          <span className="text-right">Win rate</span>
          <span className="text-right">Cette sem.</span>
          <span className="text-right">Total</span>
        </div>

        {LEAGUE_BOARD.map((r) => (
          <LeaderboardRow
            key={r.rank}
            r={r}
            avatarColor={AVATAR_COLORS[r.rank - 1] || "#5F1E92"}
          />
        ))}
      </div>
    </div>
  );
}
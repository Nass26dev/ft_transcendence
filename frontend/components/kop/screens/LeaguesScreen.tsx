"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";

// ---------- Data ----------

interface LeagueCardData {
  n: string;
  d: number;
  w: string;
  emoji: string;
  mine?: boolean;
}

const MY_LEAGUES: LeagueCardData[] = [
  { n: "Les Kopistes du Mardi", d: 12, w: "S 23", emoji: "🍻", mine: true },
  { n: "Bureau FC", d: 8, w: "S 18", emoji: "💼" },
  { n: "Famille Benkiri", d: 7, w: "S 9", emoji: "👨‍👩‍👧" },
];

interface PublicLeague {
  n: string;
  members: number;
  emoji: string;
  desc: string;
}

const TOP_LEAGUES: PublicLeague[] = [
  { n: "Ligue 1 Nation", members: 8420, emoji: "🇫🇷", desc: "La plus grande ligue francophone" },
  { n: "C1 Predictors", members: 5210, emoji: "⭐", desc: "Spé Champions League" },
  { n: "Premier League FR", members: 3840, emoji: "🇬🇧", desc: "Pour les fans de la PL" },
  { n: "Le Classique Club", members: 2150, emoji: "🔥", desc: "PSG vs OM, rien d'autre" },
  { n: "Tipsters Pro", members: 1890, emoji: "🎯", desc: "Réservée aux gros win rate" },
  { n: "Lyon Bets", members: 1240, emoji: "🦁", desc: "Communauté lyonnaise" },
];

const AVATAR_COLORS = ["#FF6B6B", "#4A8DFF", "#A3FF12", "#FFD60A", "#C9184A"];

// ---------- Sub-components ----------

function MyLeagueCard({ l }: { l: LeagueCardData }) {
  return (
    <div
      className={[
        "rounded-[10px] border bg-surface-1 p-4.5",
        l.mine ? "border-kop" : "border-border",
      ].join(" ")}
    >
      <div className="mb-2.5 text-[28px]">{l.emoji}</div>
      <div className="mb-1.5 font-display text-lg font-bold">{l.n}</div>
      <div className="mb-3.5 text-xs text-text-3">
        {l.d} membres · saison {l.w}
      </div>
      <div className="flex items-center">
        {AVATAR_COLORS.map((c, j) => (
          <div
            key={j}
            className="h-[26px] w-[26px] rounded-full border-2 border-surface-1"
            style={{ background: c, marginLeft: j > 0 ? -8 : 0 }}
          />
        ))}
        {l.d > 5 && (
          <span className="ml-2 text-xs text-text-3">+{l.d - 5}</span>
        )}
      </div>
    </div>
  );
}

function PublicLeagueRow({ l }: { l: PublicLeague }) {
  return (
    <div className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2">
      <div className="grid h-11 w-11 flex-none place-items-center rounded-lg border border-border bg-surface-2 text-xl">
        {l.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{l.n}</div>
        <div className="truncate text-xs text-text-3">{l.desc}</div>
      </div>
      <div className="text-right">
        <div className="font-mono tnum text-sm font-bold">
          {l.members.toLocaleString("fr-FR")}
        </div>
        <div className="text-[11px] text-text-3">membres</div>
      </div>
      <button className="rounded-md border border-border-strong bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:bg-surface-2">
        Rejoindre
      </button>
    </div>
  );
}

// ---------- Component ----------

export function LeaguesScreen() {
  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* ============= MES LIGUES ============= */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Mes ligues
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            3 ligues actives · 28 amis au total
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_6px_22px_-8px_var(--kop)]">
          <Icon name="plus" size={14} /> Créer une ligue
        </button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3.5">
        {MY_LEAGUES.map((l, i) => (
          <MyLeagueCard key={i} l={l} />
        ))}
      </div>

      {/* ============= TOP LIGUES PUBLIQUES ============= */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Top ligues publiques
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Rejoins une ligue ouverte et défie des milliers de Kopistes
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
        {TOP_LEAGUES.map((l, i) => (
          <PublicLeagueRow key={i} l={l} />
        ))}
      </div>
    </div>
  );
}
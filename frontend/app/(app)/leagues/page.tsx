"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { MY_LEAGUES, TOP_LEAGUES } from "@/data/kop-data";
import { MyLeagueCard } from "./_components/MyLeagueCard";
import { PublicLeagueRow } from "./_components/PublicLeagueRow";

export default function LeaguesPage() {
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

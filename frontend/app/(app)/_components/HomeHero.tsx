"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { TRENDING } from "@/data/kop-data";

interface HomeHeroProps {
  onOpen: (id: string) => void;
  onNav?: (route: string) => void;
}

export function HomeHero({ onOpen, onNav }: HomeHeroProps) {
  return (
    <div className="relative mb-7 overflow-hidden rounded-[14px] border border-border bg-gradient-to-br from-[#1A0606] to-bg px-9 py-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,var(--kop)_0%,transparent_70%)] opacity-[0.18]" />
      <div className="relative grid grid-cols-[1fr_auto] items-center gap-8">
        <div>
          <div className="mb-3.5 inline-flex gap-2">
            <Tag kind="green">Saison 2025/26</Tag>
            <Tag>Choc du week-end</Tag>
          </div>
          <h1 className="mb-2.5 font-display text-[38px] font-bold leading-none tracking-[-0.03em]">
            Le Classique. <em className="not-italic text-kop-bright">Tes pronos.</em>
            <br />
            Aucune limite.
          </h1>
          <p className="max-w-[540px] text-[14.5px] leading-[1.5] text-text-2">
            Parie en Kops, défie tes potes, grimpe au classement. Pas un centime
            sorti, mais toute l&apos;adrénaline d&apos;un vrai stade.
          </p>
          <div className="mt-5 flex gap-2.5">
            <button
              onClick={() => onOpen("m1")}
              className="inline-flex items-center gap-2 rounded-md bg-kop px-5 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_6px_22px_-8px_var(--kop)]"
            >
              Voir les cotes <Icon name="arrow" size={14} stroke={2.4} />
            </button>
            <button
              onClick={() => onNav?.("leagues")}
              className="rounded-md border border-border-strong bg-transparent px-5 py-3.5 text-[15px] font-semibold text-text transition-colors hover:bg-surface-1"
            >
              Créer une ligue
            </button>
          </div>
        </div>

        <div className="flex min-w-[280px] flex-col gap-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Tendances Kop
          </div>
          {TRENDING.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-black/35 px-3 py-2.5"
            >
              <Icon name="fire" size={16} stroke={1.8} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{t.tag}</div>
                <div className="text-[11px] text-text-3">{t.vol}</div>
              </div>
              <span className="font-mono tnum font-bold text-green">
                {t.odd.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { useTrending } from "@/hooks/useTrending";
import { currentSeasonLabel } from "@/utils/date";
import type { TrendingBet } from "@/utils/types";
import Link from "next/link";

interface HomeHeroProps {
  onOpen: (id: string) => void;
}

/** Libellé de volume selon la fenêtre réellement utilisée par l'API. */
function volLabel(t: TrendingBet): string {
  const w =
    t.window === "1h"
      ? "dernière heure"
      : t.window === "24h"
        ? "24 dernières h"
        : "au total";
  return `${t.share} % des Kopistes · ${w}`;
}

export function HomeHero({ onOpen }: HomeHeroProps) {
  const { trending } = useTrending();

  return (
    <div className="relative mb-7 overflow-hidden rounded-[14px] border border-border bg-gradient-to-br from-[#1A0606] to-bg px-5 py-7 sm:px-9 sm:py-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,var(--kop)_0%,transparent_70%)] opacity-[0.18]" />
      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-3.5 inline-flex gap-2">
            <Tag kind="green">Saison {currentSeasonLabel()}</Tag>
            <Tag>Choc du week-end</Tag>
          </div>
          <h1 className="mb-2.5 font-display text-[28px] font-bold leading-none tracking-[-0.03em] sm:text-[38px]">
            Le Classique. <em className="not-italic text-kop-bright">Tes pronos.</em>
            <br />
            Aucune limite.
          </h1>
          <p className="max-w-[540px] text-[14.5px] leading-[1.5] text-text-2">
            Parie en Kops, défie tes potes, grimpe au classement. Pas un centime
            sorti, mais toute l&apos;adrénaline d&apos;un vrai stade.
          </p>
          <div className="mt-5 flex gap-2.5">
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 rounded-md bg-kop px-5 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_6px_22px_-8px_var(--kop)]"
            >
              Voir les cotes <Icon name="arrow" size={14} stroke={2.4} />
            </Link>
            <Link
            href="/leagues"
            className="rounded-md border border-border-strong bg-transparent px-5 py-3.5 text-[15px] font-semibold text-text transition-colors hover:bg-surface-1"
          >
            Créer une ligue
          </Link>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2.5 lg:min-w-[280px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Tendances Kop
          </div>
          {trending.length === 0 ? (
            <div className="rounded-lg border border-border bg-black/35 px-3 py-2.5 text-[12px] text-text-3">
              Pas encore de tendance. Lance le premier pari.
            </div>
          ) : (
            trending.map((t) => (
              <button
                key={`${t.match_id}-${t.selection}`}
                onClick={() => onOpen(String(t.match_id))}
                className="flex items-center gap-3 rounded-lg border border-border bg-black/35 px-3 py-2.5 text-left transition-colors hover:border-border-strong hover:bg-black/50"
              >
                <Icon name="fire" size={16} stroke={1.8} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{t.label}</div>
                  <div className="text-[11px] text-text-3">{volLabel(t)}</div>
                </div>
                <span className="font-mono tnum font-bold text-green">
                  {t.odd.toFixed(2)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

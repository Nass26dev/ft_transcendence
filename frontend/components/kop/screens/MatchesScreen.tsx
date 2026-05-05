"use client";

import React from "react";
import { CompactRow } from "@/components/kop/match/CompactRow";
import { MATCHES } from "@/data/kop-data";
import type { MatchHandlers } from "@/utils/types";

type TabKey = "all" | "L1" | "UCL" | "PL";

interface Tab {
  id: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { id: "all", label: "Tous" },
  { id: "L1", label: "🇫🇷 Ligue 1" },
  { id: "UCL", label: "⭐ Champions League" },
  { id: "PL", label: "🇬🇧 Premier League" },
];

export function MatchesScreen({ onPick, isPicked, onOpen }: MatchHandlers) {
  const [tab, setTab] = React.useState<TabKey>("all");

  const filtered =
    tab === "all" ? MATCHES : MATCHES.filter((m) => m.league === tab);

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* Header */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Tous les matches
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            Football · {MATCHES.length} matches disponibles
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "-mb-px cursor-pointer px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors",
                isActive
                  ? "border-kop text-text"
                  : "border-transparent text-text-3 hover:text-text-2",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-3">
            Aucun match dans cette ligue pour le moment.
          </div>
        ) : (
          filtered.map((m) => (
            <CompactRow
              key={m.id}
              match={m}
              onPick={onPick}
              isPicked={isPicked}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
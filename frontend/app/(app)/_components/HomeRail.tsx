"use client";

import React from "react";
import { Kops } from "@/components/ui/Kops";
import { LEAGUE_BOARD } from "@/data/kop-data";
import { useChallenges } from "@/hooks/useChallenges";
import { GhostBtn } from "./GhostBtn";
import { RailFriendsFeed } from "./RailFriendsFeed";

interface HomeRailProps {
  friendsOn: boolean;
  onNav?: (route: string) => void;
}

export function HomeRail({ friendsOn, onNav }: HomeRailProps) {
  const { daily } = useChallenges();
  return (
    <aside className="flex w-[320px] flex-none flex-col gap-[18px]">
      <div className="rounded-[10px] border border-border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base">Défis du jour</h3>
          <GhostBtn onClick={() => onNav?.("challenges")}>Voir tout</GhostBtn>
        </div>
        <div className="flex flex-col gap-2.5">
          {daily.length === 0 ? (
            <div className="rounded-lg bg-surface-2 p-3 text-[12px] text-text-3">
              Connecte-toi pour voir tes défis du jour.
            </div>
          ) : (
            daily.slice(0, 2).map((c) => (
              <div key={c.code} className="rounded-lg bg-surface-2 p-3">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-[13px] font-semibold">
                    {c.icon} {c.title}
                  </span>
                  <Kops amount={c.reward} size={12} color="var(--green)" />
                </div>
                <div className="h-1 overflow-hidden rounded-[2px] bg-surface-3">
                  <div
                    className="h-full rounded-[2px] bg-green"
                    style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-text-3">
                  {c.progress} / {c.target}
                  {c.claimed && <span className="ml-2 text-green">· récupéré ✓</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {friendsOn && <RailFriendsFeed />}

      <div className="rounded-[10px] border border-border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base">Ta ligue</h3>
          <GhostBtn onClick={() => onNav?.("leagues")}>Ouvrir</GhostBtn>
        </div>
        <div className="mb-2.5 text-[12px] text-text-3">
          Les Kopistes du Mardi · 12 joueurs
        </div>
        {LEAGUE_BOARD.slice(0, 4).map((r) => (
          <div
            key={r.rank}
            className="flex items-center gap-2.5 border-b border-border py-2 text-[13px] last:border-b-0"
          >
            <span
              className={[
                "w-[22px] font-display text-sm font-bold",
                r.rank === 1
                  ? "text-yellow"
                  : r.rank === 2
                    ? "text-[#C5C9D1]"
                    : r.rank === 3
                      ? "text-[#D88B5C]"
                      : "text-text-2",
              ].join(" ")}
            >
              {r.rank}
            </span>
            <span
              className={[
                "flex-1",
                r.me ? "font-bold text-kop-bright" : "font-medium",
              ].join(" ")}
            >
              {r.user}
            </span>
            <Kops amount={r.kops} size={12} />
          </div>
        ))}
      </div>
    </aside>
  );
}

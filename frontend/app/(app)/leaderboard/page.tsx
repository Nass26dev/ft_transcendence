"use client";

import React from "react";
import { ScopeTabs, type ScopeKey } from "./_components/ScopeTabs";
import { PeriodTabs, type PeriodKey } from "./_components/PeriodTabs";
import { Podium } from "./_components/Podium";
import { LeaderboardTable } from "./_components/LeaderboardTable";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function LeaderboardPage() {
  const [scope, setScope] = React.useState<ScopeKey>("world");
  const [period, setPeriod] = React.useState<PeriodKey>("week");
  const { entries, loading } = useLeaderboard(period, scope);

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Classement
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Les meilleurs Kopistes de la plateforme
        </div>
      </div>

      <ScopeTabs scope={scope} onScope={setScope} />
      <PeriodTabs period={period} onPeriod={setPeriod} />

      {loading ? (
        <div className="rounded-[10px] border border-border bg-surface-1 p-8 text-center text-[13px] text-text-3">
          Chargement du classement…
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-surface-1 p-8 text-center text-[13px] text-text-3">
          {scope === "friends"
            ? "Aucun de tes amis n'a encore de paris réglés sur cette période."
            : "Aucun pari réglé sur cette période pour le moment."}
        </div>
      ) : (
        <>
          <Podium entries={entries.slice(0, 3)} />
          <LeaderboardTable entries={entries} />
        </>
      )}
    </div>
  );
}

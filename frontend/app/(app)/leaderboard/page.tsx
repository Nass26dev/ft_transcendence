"use client";

import React from "react";
import { LEAGUE_BOARD } from "@/data/kop-data";
import { ScopeTabs, type ScopeKey } from "./_components/ScopeTabs";
import { PeriodTabs, type PeriodKey } from "./_components/PeriodTabs";
import { Podium } from "./_components/Podium";
import { LeaderboardTable } from "./_components/LeaderboardTable";

export default function LeaderboardPage() {
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

      <ScopeTabs scope={scope} onScope={setScope} />
      <PeriodTabs period={period} onPeriod={setPeriod} />

      <Podium entries={LEAGUE_BOARD.slice(0, 3)} />
      <LeaderboardTable entries={LEAGUE_BOARD} />
    </div>
  );
}

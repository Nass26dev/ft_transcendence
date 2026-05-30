"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MATCHES } from "@/data/kop-data";
import type { Match } from "@/utils/types";
import { MatchesTabs, type TabKey } from "./_components/MatchesTabs";
import { MatchesList } from "./_components/MatchesList";

export default function MatchesPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabKey>("all");

  const handlePick = (_match: Match, _k: string) => {
    console.log("pick", _match.id, _k);
  };

  const isPicked = (_mId: string, _k: string) => false;

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

      <MatchesTabs tab={tab} onTab={setTab} />

      <MatchesList
        matches={filtered}
        onPick={handlePick}
        isPicked={isPicked}
        onOpen={(id) => router.push(`/matches/${id}`)}
      />
    </div>
  );
}

"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { useBetSlipHandlers } from "../../_components/BetSlipProvider";
import { MatchHero } from "./_components/MatchHero";
import { MatchTimeline } from "./_components/MatchTimeline";
import { MatchLineups } from "./_components/MatchLineups";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { match } = useMatchDetail(id);
  const handlers = useBetSlipHandlers();

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3"
      >
        <span className="inline-block rotate-180">
          <Icon name="chevron" size={12} />
        </span>
        Retour
      </button>

      {match ? (
        <div className="flex flex-col gap-4">
          <MatchHero match={match} {...handlers} />
          {match.events && match.events.length > 0 && (
            <MatchTimeline events={match.events} />
          )}
          {match.lineups && match.lineups.length > 0 && (
            <MatchLineups
              lineups={match.lineups}
              homeName={match.home_team}
              awayName={match.away_team}
            />
          )}
        </div>
      ) : (
        <div className="text-sm text-text-3">Chargement du match…</div>
      )}
    </div>
  );
}

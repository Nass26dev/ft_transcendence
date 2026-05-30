"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useBetSlip } from "@/hooks/useBetSlip";
import { useHomeMatches } from "@/hooks/useHomeMatches";
import { BetSlip } from "@/components/betting/BetSlip";
import { Onboarding } from "@/components/betting/Onboarding";

import { HomeHero } from "./_components/HomeHero";
import { LiveSection } from "./_components/LiveSection";
import { UpcomingSection } from "./_components/UpcomingSection";
import { HomeRail } from "./_components/HomeRail";
import { SlipFab } from "./_components/SlipFab";
import { Toast } from "./_components/Toast";

export default function HomePage() {
  const router = useRouter();

  const { live, upcoming } = useHomeMatches();
  const {
    picks,
    balance,
    slipOpen,
    setSlipOpen,
    toast,
    handlePick,
    isPicked,
    removePick,
    clearPicks,
    handlePlace,
  } = useBetSlip();

  const [showOnboard, setShowOnboard] = React.useState<boolean>(true);

  const handlers = {
    onPick: handlePick,
    isPicked,
    onOpen: (id: string) => router.push(`/matches/${id}`),
  };

  return (
    <>
      <div className="max-w-[1480px] px-8 pb-15 pt-7">
        <HomeHero onOpen={handlers.onOpen} />

        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <LiveSection matches={live} {...handlers} />
            <UpcomingSection matches={upcoming} {...handlers} />
          </div>

          <HomeRail friendsOn />
        </div>
      </div>

      {/* Bet slip */}
      {slipOpen && picks.length > 0 && (
        <BetSlip
          picks={picks}
          onRemove={removePick}
          onClear={clearPicks}
          onPlace={handlePlace}
          onClose={() => setSlipOpen(false)}
          balance={balance}
        />
      )}

      {/* Slip réduit (FAB) */}
      {!slipOpen && picks.length > 0 && (
        <SlipFab count={picks.length} onClick={() => setSlipOpen(true)} />
      )}

      {/* Toast */}
      <Toast toast={toast} />

      {/* Onboarding */}
      {/* {showOnboard && <Onboarding onClose={() => setShowOnboard(false)} />} */}
    </>
  );
}

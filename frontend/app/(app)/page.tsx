"use client";

import React from "react";

import { useHomeMatches } from "@/hooks/useHomeMatches";
import { useBetSlipHandlers } from "./_components/BetSlipProvider";
import { useProfile } from "./_components/ProfileProvider";
import { HomeHero } from "./_components/HomeHero";
import { LiveSection } from "./_components/LiveSection";
import { UpcomingSection } from "./_components/UpcomingSection";
import { HomeRail } from "./_components/HomeRail";
import { Onboarding } from "@/components/betting/Onboarding";

export default function HomePage() {
  const { live, upcoming } = useHomeMatches();
  const handlers = useBetSlipHandlers();
  const { profile, completeOnboarding } = useProfile();

  // Onboarding affiché aux utilisateurs connectés qui ne l'ont pas encore terminé.
  const showOnboarding = profile !== null && !profile.onboarding_completed;

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      <HomeHero onOpen={handlers.onOpen} />

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <LiveSection matches={live} {...handlers} />
          <UpcomingSection matches={upcoming} {...handlers} />
        </div>

        <HomeRail friendsOn />
      </div>

      {showOnboarding && <Onboarding onClose={completeOnboarding} />}
    </div>
  );
}

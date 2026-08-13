"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";

import { useHomeMatches } from "@/hooks/useHomeMatches";
import { useBetSlipHandlers } from "./_components/BetSlipProvider";
import { useProfile } from "./_components/ProfileProvider";
import { HomeHero } from "./_components/HomeHero";
import { LiveSection } from "./_components/LiveSection";
import { UpcomingSection } from "./_components/UpcomingSection";
import { HomeRail } from "./_components/HomeRail";
import { Onboarding } from "@/components/betting/Onboarding";

/**
 * Page d'accueil : matches en direct et à venir, plus le module latéral.
 * Affiche l'écran d'onboarding aux utilisateurs connectés qui ne l'ont pas encore terminé.
 */
export default function HomePage() {
  const { live, upcoming, loading } = useHomeMatches();
  const handlers = useBetSlipHandlers();
  const { profile, completeOnboarding } = useProfile();

  const showOnboarding = profile !== null && !profile.onboarding_completed;

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <HomeHero onOpen={handlers.onOpen} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <LiveSection matches={live} loading={loading} {...handlers} />
          <UpcomingSection matches={upcoming} loading={loading} {...handlers} />
        </div>

        <HomeRail friendsOn />
      </div>

      <AnimatePresence>
        {showOnboarding && <Onboarding onClose={completeOnboarding} />}
      </AnimatePresence>
    </div>
  );
}

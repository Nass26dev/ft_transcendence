"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useHomeMatches } from "@/hooks/useHomeMatches";
import { useBetSlipHandlers } from "./_components/BetSlipProvider";
import { useProfile } from "./_components/ProfileProvider";
import { HomeHero } from "./_components/HomeHero";
import { LiveSection } from "./_components/LiveSection";
import { UpcomingSection } from "./_components/UpcomingSection";
import { HomeRail } from "./_components/HomeRail";
import { Onboarding } from "@/components/betting/Onboarding";

// Mappe les clés de navigation des sections vers les vraies routes.
const NAV_ROUTES: Record<string, string> = {
  leagues: "/leagues",
  "leagues-create": "/leagues?create=1",
  challenges: "/challenges",
  live: "/live",
  sports: "/matches",
};

export default function HomePage() {
  const { live, upcoming } = useHomeMatches();
  const handlers = useBetSlipHandlers();
  const { profile, completeOnboarding } = useProfile();
  const router = useRouter();

  const onNav = React.useCallback(
    (key: string) => router.push(NAV_ROUTES[key] ?? `/${key}`),
    [router],
  );

  // Onboarding affiché aux utilisateurs connectés qui ne l'ont pas encore terminé.
  const showOnboarding = profile !== null && !profile.onboarding_completed;

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      <HomeHero onOpen={handlers.onOpen} onNav={onNav} />

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <LiveSection matches={live} {...handlers} onNav={onNav} />
          <UpcomingSection matches={upcoming} {...handlers} onNav={onNav} />
        </div>

        <HomeRail friendsOn onNav={onNav} />
      </div>

      {showOnboarding && <Onboarding onClose={completeOnboarding} />}
    </div>
  );
}

"use client";

import React from "react";

import { useHomeMatches } from "@/hooks/useHomeMatches";
import { useBetSlipHandlers } from "../_components/BetSlipProvider";
import { HomeRail } from "../_components/HomeRail";
import { LiveGrid } from "./_components/LiveGrid";
import { UpcomingList } from "./_components/UpcomingList";

export default function LivePage() {
  const { live, upcoming } = useHomeMatches();
  const handlers = useBetSlipHandlers();

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <LiveGrid matches={live} {...handlers} />
          <UpcomingList matches={upcoming} {...handlers} />
        </div>

        <HomeRail friendsOn />
      </div>
    </div>
  );
}

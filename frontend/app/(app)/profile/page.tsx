"use client";

import React from "react";
import { ProfileHero } from "./_components/ProfileHero";
import { ProfileStats } from "./_components/ProfileStats";
import { CompetitionsCard } from "./_components/CompetitionsCard";
import { BadgesCard } from "./_components/BadgesCard";

export default function ProfilePage() {
  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      <ProfileHero />
      <ProfileStats />

      <div className="flex items-start gap-4">
        {/* <CompetitionsCard /> */}
        <BadgesCard />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "../_components/ProfileProvider";
import { useChallenges } from "@/hooks/useChallenges";
import { currentSeasonLabel } from "@/utils/date";
import { DailyChallengeRow } from "./_components/DailyChallengeRow";
import { SeasonChallengeCard } from "./_components/SeasonChallengeCard";

export default function ChallengesPage() {
  const { isAuthenticated, ready } = useProfile();
  const { daily, season, claim } = useChallenges();
  const [claiming, setClaiming] = React.useState<string | null>(null);

  const handleClaim = async (code: string) => {
    setClaiming(code);
    try {
      await claim(code);
    } catch (err) {
      console.error("Récupération défi échouée:", err);
    } finally {
      setClaiming(null);
    }
  };

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">Défis</h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">Connecte-toi pour relever des défis et gagner des Kops.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-[10px] bg-kop px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* ============= DAILY ============= */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Défis du jour</h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Réinit. à 00h00 · accumule des Kops bonus
        </div>
      </div>

      <div className="mb-7 flex flex-col gap-2.5">
        {daily.map((c) => (
          <DailyChallengeRow
            key={c.code}
            c={c}
            onClaim={handleClaim}
            claiming={claiming === c.code}
          />
        ))}
      </div>

      {/* ============= SEASON ============= */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Saison {currentSeasonLabel()}</h2>
        <div className="mt-0.5 text-[13px] text-text-3">Récompenses long terme</div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {season.map((c) => (
          <SeasonChallengeCard
            key={c.code}
            c={c}
            onClaim={handleClaim}
            claiming={claiming === c.code}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "../_components/ProfileProvider";
import { ProfileHero } from "./_components/ProfileHero";
import { ProfileStats } from "./_components/ProfileStats";
import { BadgesCard } from "./_components/BadgesCard";

/** Page Profil : en-tête, statistiques et badges du joueur connecté. */
export default function ProfilePage() {
  const { isAuthenticated, ready } = useProfile();

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">Profil</h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">Connecte-toi pour voir ton profil.</p>
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
      <ProfileHero />
      <ProfileStats />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <BadgesCard />
      </div>
    </div>
  );
}

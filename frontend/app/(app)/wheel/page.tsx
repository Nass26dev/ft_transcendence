"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "../_components/ProfileProvider";
import { useWheel } from "@/hooks/useWheel";
import { WheelOfFortune } from "./_components/WheelOfFortune";

export default function WheelPage() {
  const { isAuthenticated, ready, profile, spinWheel } = useProfile();
  const { segments, loading } = useWheel();

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">
          Roue de la chance
        </h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">
            Connecte-toi pour tenter ta chance et gagner des Kops.
          </p>
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
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">
            Roue de la chance
          </h1>
          <div className="mt-0.5 text-[13px] text-text-3">
            Un tour gratuit par jour · gros lots, jackpot… ou malchance
          </div>
        </div>
        {profile && (
          <div className="rounded-[10px] border border-border bg-surface-1 px-4 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Ton solde
            </div>
            <div className="font-mono text-[16px] font-bold">
              {Number(profile.wallet).toLocaleString("fr-FR")} K
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        {loading ? (
          <div className="py-20 text-[14px] text-text-3">Chargement de la roue…</div>
        ) : (
          <WheelOfFortune
            segments={segments}
            available={profile?.wheel_available ?? false}
            onSpin={spinWheel}
          />
        )}
      </div>

      {/* Légende des lots */}
      <div className="mx-auto mt-10 max-w-[460px] rounded-[12px] border border-border bg-surface-1 p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
          Les lots
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-yellow" /> Jackpot +10 000
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-green" /> Gains +100 à +2 000
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-kop" /> Pertes −100 à −1 000
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-surface-3" /> Rien (0)
          </li>
        </ul>
      </div>
    </div>
  );
}

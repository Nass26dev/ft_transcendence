"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { BetSlip } from "@/components/kop/Slip";
import { Onboarding } from "@/components/kop/Onboarding";
import { HomeScreen } from "@/components/kop/screens/HomeScreen";

import { TEAMS } from "@/data/kop-data";
import type { Match, SlipPick, PlacePayload, Toast } from "@/utils/types";

export default function HomePage() {
  const router = useRouter();

  const [picks, setPicks] = React.useState<SlipPick[]>([]);
  const [balance, setBalance] = React.useState<number>(10000);
  const [slipOpen, setSlipOpen] = React.useState<boolean>(true);
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [showOnboard, setShowOnboard] = React.useState<boolean>(true);

  // ---------- Helpers ----------

  const labelFor = (k: string, m: Match): string => {
    if (k === "1") return `${TEAMS[m.home].n} vainqueur`;
    if (k === "2") return `${TEAMS[m.away].n} vainqueur`;
    if (k === "X") return "Match nul";
    return k;
  };

  // ---------- Handlers ----------

  const handlePick = (match: Match, k: string, customLabel?: string) => {
    setPicks((prev) => {
      const existing = prev.find((p) => p.matchId === match.id);
      const id = `${match.id}-${k}`;

      if (existing && existing.k === k) {
        return prev.filter((p) => p.matchId !== match.id);
      }

      const filtered = prev.filter((p) => p.matchId !== match.id);
      return [
        ...filtered,
        {
          id,
          matchId: match.id,
          k,
          game: `${TEAMS[match.home].sh} vs ${TEAMS[match.away].sh}`,
          label: customLabel || labelFor(k, match),
          odd: match.odds[k as "1" | "X" | "2"],
        },
      ];
    });
    setSlipOpen(true);
  };

  const isPicked = (mId: string, k: string): boolean =>
    picks.some((p) => p.matchId === mId && p.k === k);

  const removePick = (id: string) =>
    setPicks((prev) => prev.filter((p) => p.id !== id));

  const clearPicks = () => setPicks([]);

  const handlePlace = ({ stake, payout }: PlacePayload) => {
    setBalance((b) => b - stake);
    setPicks([]);
    setToast({
      type: "ok",
      msg: `Pari placé · ${stake.toLocaleString("fr-FR")} K en jeu, ${payout.toLocaleString("fr-FR")} K potentiels`,
    });
    setTimeout(() => setToast(null), 4000);
  };

  // ---------- Render ----------

  return (
    <>
      <HomeScreen
        onPick={handlePick}
        isPicked={isPicked}
        onOpen={(id) => router.push(`/matches/${id}`)}
        friendsOn={true}
      />

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
        <button
          onClick={() => setSlipOpen(true)}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 rounded-full bg-kop px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_var(--kop)] transition-colors hover:bg-kop-bright"
        >
          🎟️ Mon ticket · {picks.length} {picks.length > 1 ? "paris" : "pari"}
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-20 z-[200] flex items-center gap-2.5 rounded-[10px] border border-green bg-surface-2 px-4 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-green text-[12px] font-black text-black">
            ✓
          </span>
          {toast.msg}
        </div>
      )}

      {/* Onboarding */}
      {showOnboard && <Onboarding onClose={() => setShowOnboard(false)} />}
    </>
  );
}
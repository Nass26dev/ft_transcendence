"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { useBetSlip } from "@/hooks/useBetSlip";
import { useProfile } from "./ProfileProvider";
import { BetSlip } from "@/components/betting/BetSlip";
import type { MatchHandlers } from "@/utils/types";

import { SlipFab } from "./SlipFab";
import { Toast } from "./Toast";

const BetSlipContext = React.createContext<MatchHandlers | null>(null);

/** Handlers du ticket (onPick / isPicked / onOpen) partagés via le layout. */
export function useBetSlipHandlers(): MatchHandlers {
  const ctx = React.useContext(BetSlipContext);
  if (!ctx) {
    throw new Error(
      "useBetSlipHandlers doit être utilisé dans un <BetSlipProvider>",
    );
  }
  return ctx;
}

/**
 * Fournit le ticket de pari (BetSlip) à tout le layout applicatif, ainsi que
 * ses handlers de sélection. Parier nécessite d'être connecté : un visiteur
 * qui clique une cote est redirigé vers la connexion plutôt que d'ajouter un
 * pari inutilisable.
 */
export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, isAuthenticated, ready, refreshProfile } = useProfile();
  const balance = profile?.wallet ?? 0;
  const {
    picks,
    slipOpen,
    setSlipOpen,
    toast,
    handlePick,
    isPicked,
    removePick,
    clearPicks,
    handlePlace,
  } = useBetSlip(refreshProfile);

  const handlers: MatchHandlers = {
    onPick: (match, k) => {
      if (ready && !isAuthenticated) {
        router.push("/login");
        return;
      }
      handlePick(match, k);
    },
    isPicked,
    onOpen: (id: string) => router.push(`/matches/${id}`),
  };

  return (
    <BetSlipContext.Provider value={handlers}>
      {children}

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
        {!slipOpen && picks.length > 0 && (
          <SlipFab count={picks.length} onClick={() => setSlipOpen(true)} />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </BetSlipContext.Provider>
  );
}

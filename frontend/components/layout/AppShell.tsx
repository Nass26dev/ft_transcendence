"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BetSlipProvider } from "@/app/(app)/_components/BetSlipProvider";
import { applyReduceMotion, getPref } from "@/utils/prefs";

/** Coquille de l'app : sidebar (colonne fixe sur desktop, drawer sur mobile),
 *  topbar et contenu. Ferme le drawer à chaque navigation (mobile) et applique
 *  la préférence « animations réduites » au chargement de l'app. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    applyReduceMotion(getPref("reduceMotion", false));
  }, []);

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[232px_1fr]">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="grid min-h-screen min-w-0 grid-rows-[auto_1fr]">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main>
          <BetSlipProvider>{children}</BetSlipProvider>
        </main>
      </div>
    </div>
  );
}

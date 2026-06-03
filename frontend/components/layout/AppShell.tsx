"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BetSlipProvider } from "@/app/(app)/_components/BetSlipProvider";

/** Coquille de l'app : sidebar (colonne fixe sur desktop, drawer sur mobile),
 *  topbar et contenu. Gère l'ouverture du menu mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();

  // Ferme le drawer à chaque navigation (mobile).
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

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

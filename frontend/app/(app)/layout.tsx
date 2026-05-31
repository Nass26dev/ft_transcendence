import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BetSlipProvider } from "./_components/BetSlipProvider";
import { ProfileProvider } from "./_components/ProfileProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <div className="grid min-h-screen grid-cols-[232px_1fr]">
        <Sidebar />

        <div className="grid min-h-screen min-w-0 grid-rows-[auto_1fr]">
          <Topbar />
          <main>
            <BetSlipProvider>{children}</BetSlipProvider>
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
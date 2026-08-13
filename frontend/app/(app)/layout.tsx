import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileProvider } from "./_components/ProfileProvider";

/** Layout racine des pages authentifiées : fournit le profil et l'ossature de l'application (sidebar/topbar). */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <AppShell>{children}</AppShell>
    </ProfileProvider>
  );
}

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileProvider } from "./_components/ProfileProvider";

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

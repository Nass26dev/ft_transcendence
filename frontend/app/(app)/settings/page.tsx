"use client";

import Link from "next/link";
import { useProfile } from "../_components/ProfileProvider";
import { Card, InfoRow } from "./_components/primitives";
import { ProfileCard } from "./_components/ProfileCard";
import { PreferencesCard } from "./_components/PreferencesCard";
import { SessionCard } from "./_components/SessionCard";

/** Page Réglages : édition du profil, préférences et session (déconnexion, accès admin). */
export default function SettingsPage() {
  const { profile, isAuthenticated, ready } = useProfile();

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">
          Réglages
        </h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">
            Connecte-toi pour accéder à tes réglages.
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
    <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">
        Réglages
      </h1>
      <p className="mt-1 text-[13.5px] text-text-3">
        Gère ton compte et tes préférences.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <ProfileCard />

        <Card title="Compte">
          <InfoRow label="Email" value={profile?.email ?? "-"} />
          <InfoRow
            label="Solde Kops"
            value={(profile?.wallet ?? 0).toLocaleString("fr-FR")}
          />
        </Card>

        <PreferencesCard />
        <SessionCard />
      </div>
    </div>
  );
}

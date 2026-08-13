"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import { userInitials, displayName } from "@/utils/user";

/** En-tête du profil : avatar, identité, ancienneté et solde de Kops. */
export function ProfileHero() {
  const { profile } = useProfile();

  if (!profile) {
    return (
      <div className="mb-6 h-[140px] rounded-[10px] border border-border bg-surface-1" />
    );
  }

  const memberSince = profile.date_joined
    ? new Date(profile.date_joined).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mb-6 rounded-[10px] border border-border bg-gradient-to-br from-[#1A0808] to-surface-1 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-4 sm:gap-5">
        <Avatar
          src={profile.avatar}
          initials={userInitials(profile)}
          className="h-16 w-16 text-[22px] sm:h-20 sm:w-20 sm:text-[28px]"
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[24px] font-bold tracking-[-0.02em] sm:text-[32px]">
            {displayName(profile)}
          </h1>
          <div className="mt-1 truncate text-[13px] text-text-3">
            @{profile.username || profile.email.split("@")[0]}
            {memberSince && <> · Membre depuis {memberSince}</>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag kind="green">Pronostiqueur</Tag>
            <Tag>{profile.email}</Tag>
          </div>
        </div>

        <div className="flex-none text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Solde
          </div>
          <div className="font-display tnum text-3xl font-bold text-kop-bright sm:text-4xl">
            {profile.wallet.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-text-3">Kops</div>
        </div>
      </div>
    </div>
  );
}

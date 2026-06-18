"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import { userInitials, displayName } from "@/utils/user";

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
    <div className="mb-6 rounded-[10px] border border-border bg-gradient-to-br from-[#1A0808] to-surface-1 p-7">
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <Avatar
          src={profile.avatar}
          initials={userInitials(profile)}
          className="h-20 w-20 text-[28px]"
        />

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">
            {displayName(profile)}
          </h1>
          <div className="mt-1 text-[13px] text-text-3">
            @{profile.username || profile.email.split("@")[0]}
            {memberSince && <> · Membre depuis {memberSince}</>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag kind="green">Pronostiqueur</Tag>
            <Tag>{profile.email}</Tag>
          </div>
        </div>

        {/* Balance */}
        <div className="flex-none text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Solde
          </div>
          <div className="font-display tnum text-4xl font-bold text-kop-bright">
            {profile.wallet.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-text-3">Kops</div>
        </div>
      </div>
    </div>
  );
}

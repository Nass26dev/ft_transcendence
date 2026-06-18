"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import { userInitials } from "@/utils/user";
import { TopbarSearch } from "./TopbarSearch";
import { NotificationBell } from "./NotificationBell";

interface TopbarProps {
  /** Ouvre le menu latéral (mobile). */
  onMenu?: () => void;
}

export function Topbar({ onMenu }: TopbarProps) {
  const { profile, isAuthenticated, ready } = useProfile();
  const balance = profile?.wallet ?? 0;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-bg px-4 py-3.5 sm:gap-4 lg:px-8">
      {/* Menu mobile */}
      <button
        onClick={onMenu}
        title="Menu"
        className="rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text lg:hidden"
      >
        <Icon name="menu" size={20} stroke={1.8} />
      </button>

      {/* Search */}
      <TopbarSearch />

      <div className="flex-1" />

      {!ready ? (
        // Évite le flash "boutons connexion" avant que le profil soit chargé.
        <div className="h-9 w-[180px]" />
      ) : isAuthenticated ? (
        <>
          {/* Balance */}
          <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-gradient-to-b from-surface-2 to-surface-1 px-3.5 py-2">
            <div className="grid h-[22px] w-[22px] place-items-center rounded-full bg-kop font-display text-[13px] font-extrabold text-white">
              K
            </div>
            <div>
              <div className="tnum text-[15px] font-bold tracking-[-0.01em]">
                {balance.toLocaleString("fr-FR")}
              </div>
              <div className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3 sm:block">
                Solde Kops
              </div>
            </div>
          </div>

          {/* Notif / Settings */}
          <NotificationBell />
          <Link
            href="/settings"
            title="Réglages"
            className="hidden rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text sm:block"
          >
            <Icon name="settings" size={18} stroke={1.6} />
          </Link>

          {/* Avatar */}
          <Link
            href="/profile"
            title={profile ? `@${profile.username || profile.email}` : "Profil"}
            className="flex-none"
          >
            <Avatar
              src={profile?.avatar}
              initials={profile ? userInitials(profile) : "?"}
              className="h-9 w-9 cursor-pointer text-[13px]"
            />
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-[10px] border border-border bg-surface-1 px-4 py-2 text-[13px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-[10px] bg-kop px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_6px_22px_-8px_var(--kop)]"
          >
            S&apos;inscrire
          </Link>
        </div>
      )}
    </div>
  );
}
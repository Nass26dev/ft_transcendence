"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";

export function Topbar() {
  const { profile, isAuthenticated, ready } = useProfile();
  const balance = profile?.wallet ?? 0;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-bg px-8 py-3.5">
      {/* Search */}
      <div className="flex max-w-[420px] flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-surface-1 px-3 py-2.5">
        <Icon name="search" size={16} stroke={1.8} />
        <input
          placeholder="Rechercher un match, un joueur, une ligue…"
          className="flex-1 border-none bg-transparent text-[13.5px] outline-none placeholder:text-text-3"
        />
        <span className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-text-3">
          ⌘K
        </span>
      </div>

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
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                Solde Kops
              </div>
            </div>
          </div>

          {/* Notif / Settings */}
          <button
            title="Notifications"
            className="rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text"
          >
            <Icon name="bell" size={18} stroke={1.8} />
          </button>
          <button
            title="Réglages"
            className="rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text"
          >
            <Icon name="settings" size={18} stroke={1.6} />
          </button>

          {/* Avatar */}
          <Link
            href="/profile"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[13px] font-bold"
          >
            YO
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
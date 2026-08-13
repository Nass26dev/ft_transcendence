"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Kops } from "@/components/ui/Kops";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import { useHomeMatches } from "@/hooks/useHomeMatches";
import { useBets } from "@/hooks/useBets";

/** Entrée de navigation (lien, icône et badge optionnel) de la sidebar. */
interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: string;
  badgeMuted?: string;
}

/** Construit la nav principale (le badge "En direct" reflète le nombre de matchs live). */
function buildItems(liveCount: number): NavItem[] {
  return [
    { href: "/", label: "Accueil", icon: "home" },
    {
      href: "/live",
      label: "En direct",
      icon: "live",
      badge: liveCount > 0 ? String(liveCount) : undefined,
    },
    { href: "/matches", label: "Tous les matchs", icon: "sports" },
  ];
}

/** Construit la nav sociale. Les entrées personnelles (Mes paris, Amis) ne
 *  sont affichées qu'aux utilisateurs connectés. */
function buildSocial(pendingBetsCount: number, isAuthenticated: boolean): NavItem[] {
  const personal: NavItem[] = isAuthenticated
    ? [
        {
          href: "/tickets",
          label: "Mes paris",
          icon: "ticket",
          badge: pendingBetsCount > 0 ? String(pendingBetsCount) : undefined,
        },
        { href: "/chat", label: "Messages", icon: "chat" },
        { href: "/friends", label: "Amis", icon: "user" },
      ]
    : [];
  return [
    ...personal,
    { href: "/leagues", label: "Ligues", icon: "league" },
    { href: "/leaderboard", label: "Classement", icon: "trophy" },
    { href: "/challenges", label: "Défis", icon: "flame" },
    { href: "/wheel", label: "Roue", icon: "gift" },
  ];
}

/** Nav du compte, réservée aux utilisateurs connectés. */
const ME: NavItem[] = [
  { href: "/profile", label: "Profil", icon: "user" },
  { href: "/settings", label: "Réglages", icon: "settings" },
];

/** Titre de section (petites majuscules) au-dessus d'un groupe de liens. */
function NavSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-3">
      {children}
    </div>
  );
}

/** Lien de nav mis en évidence si l'URL courante correspond exactement, ou
 *  pour une sous-route (ex. /matches/m1 → l'entrée /matches reste active). */
function NavItemRow({ it }: { it: NavItem }) {
  const pathname = usePathname();
  const isActive =
    it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);

  return (
    <Link
      href={it.href}
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-surface-2 text-text"
          : "text-text-2 hover:bg-surface-1 hover:text-text",
      ].join(" ")}
    >
      <Icon name={it.icon} size={18} stroke={1.8} />
      <span className="flex-1">{it.label}</span>

      {it.badge && (
        <span className="ml-auto rounded bg-kop px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {it.badge}
        </span>
      )}
      {it.badgeMuted && (
        <span className="ml-auto rounded bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-text-2">
          {it.badgeMuted}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  /** Drawer ouvert (mobile uniquement). */
  open?: boolean;
  onClose?: () => void;
}

/** Barre de navigation principale de l'app : logo, nav principale, section
 *  sociale, compte (si connecté) et bonus quotidien. Colonne fixe sur desktop,
 *  drawer fermable sur mobile. */
export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { profile, isAuthenticated, claimDailyBonus } = useProfile();
  const available = profile?.daily_bonus_available ?? false;

  const { live } = useHomeMatches();
  const { bets } = useBets();

  const liveCount = live.length;
  const pendingBetsCount = bets.filter((b) => b.status === "pending").length;

  const items = buildItems(liveCount);
  const social = buildSocial(pendingBetsCount, isAuthenticated);

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/60 lg:hidden",
          open ? "block" : "hidden",
        ].join(" ")}
      />

      <aside
        onClick={onClose}
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[232px] flex-col gap-7 overflow-y-auto border-r border-border bg-bg px-4 py-5 transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <img src="/logo-clear.png" alt="Kop" className="h-7 w-auto" />
        <span className="font-display text-[22px] font-bold tracking-[-0.03em]">
          Kop
        </span>
      </Link>

      <div className="flex flex-col gap-0.5">
        {items.map((it) => (
          <NavItemRow key={it.href} it={it} />
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        <NavSectionTitle>Social</NavSectionTitle>
        {social.map((it) => (
          <NavItemRow key={it.href} it={it} />
        ))}
      </div>

      {isAuthenticated && (
        <div className="flex flex-col gap-0.5">
          <NavSectionTitle>Compte</NavSectionTitle>
          {ME.map((it) => (
            <NavItemRow key={it.href} it={it} />
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
      {available && (
        <div className="rounded-[10px] border border-border bg-surface-1 p-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Bonus quotidien
          </div>
          <div className="mb-2.5 flex items-center gap-2">
            <Kops amount={500} size={15} color="var(--green)" />
          </div>
          <button
            onClick={() => claimDailyBonus()}
            className="w-full rounded-md bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:bg-kop-bright hover:-translate-y-px hover:shadow-[0_6px_22px_-8px_var(--kop)]"
          >
            Récupérer
          </button>
        </div>
      )}

        <div className="flex flex-wrap gap-x-2.5 gap-y-1 px-2 text-[11px] text-text-4">
          <Link href="/privacy" className="transition-colors hover:text-text-2">
            Confidentialité
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="transition-colors hover:text-text-2">
            Conditions
          </Link>
        </div>
      </div>
      </aside>
    </>
  );
}
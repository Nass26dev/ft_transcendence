"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/kop/ui/Icon";
import { Kops } from "@/components/kop/ui/Kops";

// ---------- Types ----------

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
  badgeMuted?: string;
}

// ---------- Data ----------

const ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/live", label: "En direct", icon: "live", badge: "4" },
  { href: "/matches", label: "Tous les matchs", icon: "sports" },
];

const SOCIAL: NavItem[] = [
  { href: "/tickets", label: "Mes paris", icon: "ticket", badge: "1" },
  { href: "/leagues", label: "Ligues", icon: "league" },
  { href: "/leaderboard", label: "Classement", icon: "trophy" },
  { href: "/challenges", label: "Défis", icon: "flame", badgeMuted: "3" },
];

const ME: NavItem[] = [{ href: "/profile", label: "Profil", icon: "user" }];

// ---------- Sub-components ----------

function NavSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-3">
      {children}
    </div>
  );
}

function NavItemRow({ it }: { it: NavItem }) {
  const pathname = usePathname();
  // Active si exactement la même URL, ou pour les sous-routes (/matches/m1 → /match actif)
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

// ---------- Component ----------

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[232px] flex-col gap-7 border-r border-border bg-bg px-4 py-5">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <img src="/assets/logo.png" alt="Kop" className="h-7 w-auto" />
        <span className="font-display text-[22px] font-bold tracking-[-0.03em]">
          Kop
        </span>
      </Link>

      {/* Main nav */}
      <div className="flex flex-col gap-0.5">
        {ITEMS.map((it) => (
          <NavItemRow key={it.href} it={it} />
        ))}
      </div>

      {/* Social */}
      <div className="flex flex-col gap-0.5">
        <NavSectionTitle>Social</NavSectionTitle>
        {SOCIAL.map((it) => (
          <NavItemRow key={it.href} it={it} />
        ))}
      </div>

      {/* Compte */}
      <div className="flex flex-col gap-0.5">
        <NavSectionTitle>Compte</NavSectionTitle>
        {ME.map((it) => (
          <NavItemRow key={it.href} it={it} />
        ))}
      </div>

      {/* Bonus card */}
      <div className="mt-auto rounded-[10px] border border-border bg-surface-1 p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
          Bonus quotidien
        </div>
        <div className="mb-2.5 flex items-center gap-2">
          <Kops amount={500} size={15} color="var(--green)" />
        </div>
        <button className="w-full rounded-md bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:bg-kop-bright hover:-translate-y-px hover:shadow-[0_6px_22px_-8px_var(--kop)]">
          Récupérer
        </button>
      </div>
    </aside>
  );
}
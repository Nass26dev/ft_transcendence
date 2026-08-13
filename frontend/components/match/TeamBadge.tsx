"use client";

import React, { useState } from "react";
import { teamFlag } from "@/utils/teams";

interface TeamBadgeProps {
  team: string | undefined | null;
  /** Domicile = maillot rouge (kop), extérieur = maillot bleu. */
  side: "home" | "away";
  /** URL du logo (TheSportsDB), si connu. */
  logo?: string | null;
  /** Couleur officielle du club (hex, TheSportsDB), si le logo n'est pas connu. */
  color?: string | null;
  size?: number;
}

/** Maillot générique (t-shirt) coloré. */
function Jersey({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="flex-none"
    >
      <path
        d="M8 3 L2 7 L5 10.8 L6.5 9.6 L6.5 21 L17.5 21 L17.5 9.6 L19 10.8 L22 7 L16 3 C15 5.2 13.2 6 12 6 C10.8 6 9 5.2 8 3 Z"
        fill={color}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Visuel d'équipe : logo du club si connu (TheSportsDB), sinon maillot dans
 * la couleur officielle du club si connue, sinon drapeau si sélection
 * nationale (Coupe du monde…), sinon maillot par défaut (domicile rouge /
 * extérieur bleu).
 */
export function TeamBadge({ team, side, logo, color, size = 22 }: TeamBadgeProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const flag = teamFlag(team);

  if (logo && !logoFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- domaine externe (TheSportsDB), pas d'optimisation next/image utile ici.
      <img
        src={logo}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className="flex-none rounded-full object-contain"
        style={{ width: size, height: size }}
        onError={() => setLogoFailed(true)}
      />
    );
  }

  if (color && /^#[0-9a-fA-F]{3,8}$/.test(color)) {
    return <Jersey color={color} size={size} />;
  }

  if (flag) {
    return (
      <span
        aria-hidden
        className="inline-flex flex-none items-center justify-center leading-none"
        style={{ width: size, height: size, fontSize: size * 0.92 }}
      >
        {flag}
      </span>
    );
  }

  return <Jersey color={side === "home" ? "var(--kop)" : "var(--blue)"} size={size} />;
}

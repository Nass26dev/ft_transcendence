"use client";

import React from "react";

interface KCoinProps {
  size?: number;
}

/** Pastille ronde « K » représentant la pièce Kop. */
export function KCoin({ size = 16 }: KCoinProps) {
  return (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--kop)",
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: size * 0.6,
        flex: `0 0 ${size}px`,
      }}
    >
      K
    </span>
  );
}

interface KopsProps {
  amount: number;
  sign?: boolean;
  size?: number;
  color?: string;
}

/** Montant en Kops formaté (fr-FR) suivi de la pièce. `sign` affiche +/− devant. */
export function Kops({ amount, sign = false, size = 14, color }: KopsProps) {
  const formatted = Math.abs(amount).toLocaleString("fr-FR");

  return (
    <span
      className="font-mono tnum"
      style={{
        fontWeight: 700,
        fontSize: size,
        color: color || "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {sign && amount > 0 && "+"}
      {sign && amount < 0 && "−"}
      {formatted} <KCoin size={size * 0.85} />
    </span>
  );
}
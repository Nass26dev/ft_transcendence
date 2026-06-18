"use client";

import React from "react";
import Link from "next/link";

const GHOST_CLASS =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3";

/** Petit bouton fantôme. Rend un <Link> si `href` est fourni (navigation),
 *  sinon un <button> avec `onClick` (action). */
export function GhostBtn({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={GHOST_CLASS}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={GHOST_CLASS}>
      {children}
    </button>
  );
}

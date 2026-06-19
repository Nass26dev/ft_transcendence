"use client";

import React from "react";

/** Bloc placeholder pulsé (chargement). La couleur ressort sur surface-1. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={["animate-pulse rounded bg-surface-2", className].join(" ")} />
  );
}

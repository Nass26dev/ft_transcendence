import React from "react";

/** Barre de progression (vert) — pourcentage borné à 100. */
export function ProgressBar({
  progress,
  total,
}: {
  progress: number;
  total: number;
}) {
  const pct = Math.min(100, (progress / total) * 100);
  return (
    <div className="h-1 overflow-hidden rounded-[2px] bg-surface-3">
      <div
        className="h-full rounded-[2px] bg-green transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

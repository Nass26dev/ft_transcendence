"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaKind?: "up" | "down" | "muted";
  valueKind?: "default" | "green";
}

export function StatCard({
  label,
  value,
  delta,
  deltaKind = "muted",
  valueKind = "default",
}: StatCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
        {label}
      </div>
      <div
        className={[
          "mt-1.5 font-display tnum text-[28px] font-bold tracking-[-0.02em]",
          valueKind === "green" ? "text-green" : "",
        ].join(" ")}
      >
        {value}
      </div>
      {delta && (
        <div
          className={[
            "mt-1 text-xs font-semibold",
            deltaKind === "up"
              ? "text-green"
              : deltaKind === "down"
                ? "text-kop-bright"
                : "text-text-3",
          ].join(" ")}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
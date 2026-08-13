"use client";

import React from "react";

interface OddPillProps {
  label: string;
  value: number;
  selected: boolean;
  trend?: "up" | "down";
  onClick: () => void;
  fullWidth?: boolean;
}

export function OddPill({
  label,
  value,
  selected,
  trend,
  onClick,
  fullWidth = false,
}: OddPillProps) {
  return (
    <div
      data-odd-pill
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={[
        "relative inline-flex min-w-[64px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 font-mono text-sm font-bold transition-all",
        fullWidth ? "flex-1" : "",
        selected
          ? "border-kop-bright bg-kop text-white shadow-[0_0_0_1px_var(--kop-bright),0_6px_18px_-6px_var(--kop)]"
          : "border-border bg-surface-2 hover:border-kop hover:text-text",
      ].join(" ")}
    >
      <span
        className={[
          "font-ui text-[11px] font-semibold uppercase tracking-[0.05em]",
          selected ? "text-white/75" : "text-text-3",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="tnum">{typeof value === "number" ? value.toFixed(2) : "-"}</span>

      {trend === "up" && (
        <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-bg text-[9px] text-green">
          ▲
        </span>
      )}
      {trend === "down" && (
        <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-bg text-[9px] text-kop-bright">
          ▼
        </span>
      )}
    </div>
  );
}
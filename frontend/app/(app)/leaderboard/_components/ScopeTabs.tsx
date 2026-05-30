"use client";

import React from "react";

export type ScopeKey = "world" | "france" | "lyon" | "friends";

const SCOPES: { id: ScopeKey; label: string }[] = [
  { id: "world", label: "🌍 Monde" },
  { id: "france", label: "🇫🇷 France" },
  { id: "lyon", label: "🦁 Lyon" },
  { id: "friends", label: "👥 Amis" },
];

export function ScopeTabs({
  scope,
  onScope,
}: {
  scope: ScopeKey;
  onScope: (scope: ScopeKey) => void;
}) {
  return (
    <div className="mb-3 flex gap-1 border-b border-border">
      {SCOPES.map((s) => {
        const isActive = scope === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onScope(s.id)}
            className={[
              "-mb-px cursor-pointer px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors",
              isActive
                ? "border-kop text-text"
                : "border-transparent text-text-3 hover:text-text-2",
            ].join(" ")}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

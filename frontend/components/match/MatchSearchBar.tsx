"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";

interface MatchSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Champ de recherche de match (par équipe ou compétition). */
export function MatchSearchBar({
  value,
  onChange,
  placeholder = "Rechercher une équipe, une compétition…",
  className = "",
}: MatchSearchBarProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-[10px] border border-border bg-surface-1 px-3 py-2.5 transition-colors focus-within:border-border-strong ${className}`}
    >
      <Icon name="search" size={16} stroke={1.8} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onChange("")}
        placeholder={placeholder}
        className="w-full min-w-0 flex-1 border-none bg-transparent text-[13.5px] outline-none placeholder:text-text-3"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Effacer"
          className="flex-none rounded p-0.5 text-text-3 transition-colors hover:text-text"
        >
          <Icon name="x" size={15} stroke={1.8} />
        </button>
      )}
    </div>
  );
}

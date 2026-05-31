import React from "react";
import type { PublicLeague } from "@/utils/types";

export function PublicLeagueRow({ l }: { l: PublicLeague }) {
  return (
    <div className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2">
      <div className="grid h-11 w-11 flex-none place-items-center rounded-lg border border-border bg-surface-2 text-xl">
        {l.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{l.n}</div>
        <div className="truncate text-xs text-text-3">{l.desc}</div>
      </div>
      <div className="text-right">
        <div className="font-mono tnum text-sm font-bold">
          {l.members.toLocaleString("fr-FR")}
        </div>
        <div className="text-[11px] text-text-3">membres</div>
      </div>
      <button className="rounded-md border border-border-strong bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:bg-surface-2">
        Rejoindre
      </button>
    </div>
  );
}

import React from "react";
import type { ApiLeague } from "@/utils/types";
import { leagueEmoji } from "@/utils/league";

/** Ligne d'une ligue publique dans la liste des ligues à rejoindre. */
export function PublicLeagueRow({
  league,
  onJoin,
}: {
  league: ApiLeague;
  onJoin: (league: ApiLeague) => void;
}) {
  return (
    <div className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2">
      <div className="grid h-11 w-11 flex-none place-items-center rounded-lg border border-border bg-surface-2 text-xl">
        {leagueEmoji(league.id)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{league.name}</div>
        <div className="truncate text-xs text-text-3">
          {league.description || `Ligue de ${league.creator}`}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono tnum text-sm font-bold">
          {league.members_count.toLocaleString("fr-FR")}
        </div>
        <div className="text-[11px] text-text-3">
          membre{league.members_count > 1 ? "s" : ""}
        </div>
      </div>
      <button
        onClick={() => onJoin(league)}
        className="rounded-md border border-border-strong bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:bg-surface-2"
      >
        Rejoindre
      </button>
    </div>
  );
}

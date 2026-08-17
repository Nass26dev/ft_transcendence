import React from "react";
import type { ApiLeague } from "@/utils/types";
import { leagueEmoji } from "@/utils/league";
import { Icon } from "@/components/ui/Icon";

const AVATAR_COLORS = ["#FF6B6B", "#4A8DFF", "#A3FF12", "#FFD60A", "#C9184A"];

/** Carte d'une ligue dont l'utilisateur est membre, avec actions inviter/quitter. */
export function MyLeagueCard({
  league,
  isOwner,
  onLeave,
  onInvite,
  onEdit,
  onClick,
}: {
  league: ApiLeague;
  isOwner: boolean;
  onLeave: (id: number) => void;
  onInvite: (league: ApiLeague) => void;
  /** Ouvre la modale de modification/suppression (créateur uniquement). */
  onEdit?: (league: ApiLeague) => void;
  onClick?: (league: ApiLeague) => void;
}) {
  const count = league.members_count;

  return (
    <div
      onClick={() => onClick?.(league)}
      className={[
        "flex flex-col rounded-[10px] border bg-surface-1 p-4.5",
        isOwner ? "border-kop" : "border-border",
        onClick ? "cursor-pointer" : "",
      ].join(" ")}
    >
      <div className="mb-2.5 flex items-start justify-between">
        <div className="text-[28px]">{leagueEmoji(league.id)}</div>
        {isOwner && (
          <span className="rounded-full border border-kop px-2 py-0.5 text-[10.5px] font-semibold text-kop">
            Créateur
          </span>
        )}
      </div>
      <div className="mb-1.5 font-display text-lg font-bold">{league.name}</div>
      <div className="mb-3.5 text-xs text-text-3">
        {count} membre{count > 1 ? "s" : ""} · par {league.creator}
      </div>
      {league.description && (
        <div className="mb-3.5 line-clamp-2 text-xs text-text-3">
          {league.description}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center">
          {AVATAR_COLORS.slice(0, Math.min(count, 5)).map((c, j) => (
            <div
              key={j}
              className="h-[26px] w-[26px] rounded-full border-2 border-surface-1"
              style={{ background: c, marginLeft: j > 0 ? -8 : 0 }}
            />
          ))}
          {count > 5 && (
            <span className="ml-2 text-xs text-text-3">+{count - 5}</span>
          )}
        </div>
        {isOwner ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onInvite(league); }}
              className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-transparent px-2.5 py-1 text-[12px] font-semibold text-text-2 transition-colors hover:border-kop hover:text-kop"
            >
              <Icon name="plus" size={12} /> Inviter
            </button>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(league); }}
                className="rounded-md border border-border-strong bg-transparent px-2.5 py-1 text-[12px] font-semibold text-text-3 transition-colors hover:border-kop hover:text-kop"
              >
                Modifier
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onLeave(league.id); }}
            className="rounded-md border border-border-strong bg-transparent px-2.5 py-1 text-[12px] font-semibold text-text-3 transition-colors hover:border-kop hover:text-kop"
          >
            Quitter
          </button>
        )}
      </div>
    </div>
  );
}
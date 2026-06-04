import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ApiLeague } from "@/utils/types";
import { leagueEmoji } from "@/utils/league";
import api from "@/utils/api";

type Member = {
  id: number;
  username: string;
};

const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FAEEDA", text: "#854F0B" },
  { bg: "#FAECE7", text: "#993C1D" },
];

export function LeagueDetailModal({
  league,
  isOwner,
  currentUserId,
  onClose,
  onLeave,
  onInvite,
  onKick,
}: {
  league: ApiLeague;
  isOwner: boolean;
  currentUserId: number;
  onClose: () => void;
  onLeave: (id: number) => void;
  onInvite: (league: ApiLeague) => void;
  onKick: (leagueId: number, userId: number) => void;

}) {
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
    const fetchMembers = async () => {
        try {
        const res = await api.get(`/api/league/${league.id}/members/`);
        setMembers(res.data);
        } catch (error) {
            console.log(league.id);
        console.error(error);
        }
    };

    fetchMembers();
    }, [league.id]);

  // Fermer au clic sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface-1 overflow-hidden">

        {/* Header */}
        <div className="p-5 pb-0">
          <div className="mb-1 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[28px]">{leagueEmoji(league.id)}</span>
              {isOwner && (
                <span className="rounded-full border border-kop px-2 py-0.5 text-[10.5px] font-semibold text-kop">
                  Créateur
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-text-3 hover:bg-surface-2"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="font-display text-xl font-bold mt-2">{league.name}</div>
          <div className="mt-1 text-xs text-text-3">
            {league.members_count} membre{league.members_count > 1 ? "s" : ""} · par {league.creator}
          </div>
          {league.description && (
            <p className="mt-2 mb-4 text-xs text-text-3 leading-relaxed">
              {league.description}
            </p>
          )}
        </div>

        <div className="h-px bg-border mx-0 my-3" />

        {/* Membres */}
        <div className="px-5">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-3">
            Membres
          </div>
          <div className="flex flex-col gap-1">
            {members.slice(0, 6).map((m, i) => {
              const colors = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const isMe = m.id === currentUserId;
              return (
                <div key={m.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {m.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm">{m.username}</span>
                    {isMe && (
                      <span className="rounded text-[10px] px-1.5 py-0.5 bg-surface-2 text-text-3">
                        moi
                      </span>
                    )}
                    {m.username === league.creator && (
                      <span className="rounded text-[10px] px-1.5 py-0.5 bg-kop/10 text-kop">
                        créateur
                      </span>
                    )}
                  </div>
                  {isOwner && !isMe && m.username !== league.creator && (
                    <button
                      onClick={() => onKick(league.id, m.id)}
                      className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] text-red-500 hover:bg-red-50"
                    >
                      <Icon name="x" size={13} /> Exclure
                    </button>
                  )}
                </div>
              );
            })}
            {members.length > 6 && (
              <p className="text-xs text-text-3 mt-1">
                +{members.length - 6} autres membres
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-border mx-0 my-3" />

        {/* Actions */}
        <div className="flex flex-col gap-2 px-5 pb-5">
          {isOwner && (
            <button
              onClick={() => onInvite(league)}
              className="flex w-full items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-surface-2"
            >
              <Icon name="plus" size={17} /> Inviter un ami
            </button>
          )}
          <button
            onClick={() => {/* navigation vers /leagues/[id]/leaderboard */}}
            className="flex w-full items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-surface-2"
          >
            <Icon name="trophy" size={17} /> Voir le classement
          </button>
          {!isOwner && (
            <button
              onClick={() => onLeave(league.id)}
              className="flex w-full items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
            >
              <Icon name="door-exit" size={17} /> Quitter la ligue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import { useLeagues } from "@/hooks/useLeagues";
import { Toast } from "@/app/(app)/_components/Toast";
import type { ApiLeague, Toast as ToastData } from "@/utils/types";
import { MyLeagueCard } from "./_components/MyLeagueCard";
import { PublicLeagueRow } from "./_components/PublicLeagueRow";
import { CreateLeagueModal } from "./_components/CreateLeagueModal";
import { InviteModal } from "./_components/InviteModal";

export default function LeaguesPage() {
  const { profile, isAuthenticated, ready } = useProfile();
  const {
    myLeagues,
    publicLeagues,
    invitations,
    loading,
    createLeague,
    leaveLeague,
    sendInvite,
    acceptInvitation,
    declineInvitation,
  } = useLeagues();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [inviteLeague, setInviteLeague] = React.useState<ApiLeague | null>(null);
  const [toast, setToast] = React.useState<ToastData | null>(null);

  const showToast = React.useCallback((t: ToastData) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const totalMembers = myLeagues.reduce((sum, l) => sum + l.members_count, 0);

  async function handleLeave(id: number) {
    try {
      await leaveLeague(id);
      showToast({ type: "ok", msg: "Tu as quitté la ligue." });
    } catch {
      showToast({ type: "err", msg: "Impossible de quitter la ligue." });
    }
  }

  async function handleAccept(id: number) {
    try {
      await acceptInvitation(id);
      showToast({ type: "ok", msg: "Invitation acceptée." });
    } catch {
      showToast({ type: "err", msg: "Action impossible." });
    }
  }

  async function handleDecline(id: number) {
    try {
      await declineInvitation(id);
      showToast({ type: "ok", msg: "Invitation refusée." });
    } catch {
      showToast({ type: "err", msg: "Action impossible." });
    }
  }

  // Rejoindre une ligue se fait uniquement sur invitation du créateur côté
  // backend : pas d'endpoint d'adhésion libre. On informe l'utilisateur.
  function handleJoin(_league: ApiLeague) {
    showToast({
      type: "err",
      msg: "Rejoindre une ligue se fait sur invitation du créateur.",
    });
  }

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[1480px] px-8 pb-15 pt-7">
        <div className="rounded-[10px] border border-border bg-surface-1 p-8 text-center text-text-3">
          Connecte-toi pour voir et gérer tes ligues.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      <Toast toast={toast} />

      {/* ============= MES LIGUES ============= */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            Mes ligues
          </h2>
          <div className="mt-0.5 text-[13px] text-text-3">
            {myLeagues.length} ligue{myLeagues.length > 1 ? "s" : ""} active
            {myLeagues.length > 1 ? "s" : ""} · {totalMembers} membre
            {totalMembers > 1 ? "s" : ""} au total
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_6px_22px_-8px_var(--kop)]"
        >
          <Icon name="plus" size={14} /> Créer une ligue
        </button>
      </div>

      {loading ? (
        <div className="mb-8 text-[13px] text-text-3">Chargement…</div>
      ) : myLeagues.length === 0 ? (
        <div className="mb-8 rounded-[10px] border border-border bg-surface-1 p-6 text-[13px] text-text-3">
          Tu n&apos;as encore aucune ligue. Crée-en une pour défier tes amis.
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-3 gap-3.5">
          {myLeagues.map((l) => (
            <MyLeagueCard
              key={l.id}
              league={l}
              isOwner={l.creator === profile?.username}
              onLeave={handleLeave}
              onInvite={setInviteLeague}
            />
          ))}
        </div>
      )}

      {/* ============= INVITATIONS ============= */}
      {invitations.length > 0 && (
        <>
          <div className="mb-3.5">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Invitations
            </h2>
            <div className="mt-0.5 text-[13px] text-text-3">
              Tu as été invité à rejoindre {invitations.length} ligue
              {invitations.length > 1 ? "s" : ""}
            </div>
          </div>

          <div className="mb-8 overflow-hidden rounded-[10px] border border-border bg-surface-1">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{inv.league}</div>
                  <div className="truncate text-xs text-text-3">
                    Invité par {inv.sender}
                  </div>
                </div>
                <button
                  onClick={() => handleAccept(inv.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-kop-bright"
                >
                  <Icon name="check" size={14} /> Accepter
                </button>
                <button
                  onClick={() => handleDecline(inv.id)}
                  className="rounded-md border border-border-strong bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text-3 transition-colors hover:border-kop hover:text-kop"
                >
                  Refuser
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============= TOP LIGUES PUBLIQUES ============= */}
      <div className="mb-3.5">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          Top ligues publiques
        </h2>
        <div className="mt-0.5 text-[13px] text-text-3">
          Rejoins une ligue ouverte et défie des milliers de Kopistes
        </div>
      </div>

      {loading ? (
        <div className="text-[13px] text-text-3">Chargement…</div>
      ) : publicLeagues.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-surface-1 p-6 text-[13px] text-text-3">
          Aucune autre ligue publique pour le moment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
          {publicLeagues.map((l) => (
            <PublicLeagueRow key={l.id} league={l} onJoin={handleJoin} />
          ))}
        </div>
      )}

      {modalOpen && (
        <CreateLeagueModal
          onClose={() => setModalOpen(false)}
          onCreate={async (name, description) => {
            await createLeague(name, description);
            showToast({ type: "ok", msg: "Ligue créée !" });
          }}
        />
      )}

      {inviteLeague && (
        <InviteModal
          league={inviteLeague}
          onClose={() => setInviteLeague(null)}
          onInvite={(receiverId) => sendInvite(inviteLeague.id, receiverId)}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { ApiLeague, ApiLeagueInvitation } from "@/utils/types";

/** Ligues de l'utilisateur, ligues publiques, invitations + actions associées. */
export function useLeagues() {
  const { isAuthenticated, ready } = useProfile();
  const [myLeagues, setMyLeagues] = useState<ApiLeague[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<ApiLeague[]>([]);
  const [invitations, setInvitations] = useState<ApiLeagueInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [mine, all, invites] = await Promise.all([
        api.get<ApiLeague[]>("/api/league/list/"),
        api.get<ApiLeague[]>("/api/league/all-league/"),
        api.get<ApiLeagueInvitation[]>("/api/league/invitations/"),
      ]);
      const mineList = mine.data ?? [];
      const mineIds = new Set(mineList.map((l) => l.id));
      setMyLeagues(mineList);
      // Ligues publiques = toutes les ligues sauf celles dont je suis déjà membre.
      setPublicLeagues((all.data ?? []).filter((l) => !mineIds.has(l.id)));
      setInvitations(invites.data ?? []);
    } catch (err) {
      console.error("Erreur chargement ligues:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setMyLeagues([]);
      setPublicLeagues([]);
      setInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [ready, isAuthenticated, load]);

  const createLeague = useCallback(
    async (name: string, description: string) => {
      await api.post("/api/league/create/", { name, description });
      await load();
    },
    [load],
  );

  const leaveLeague = useCallback(
    async (id: number) => {
      await api.post(`/api/league/${id}/leave/`);
      await load();
    },
    [load],
  );

  /** Invite un utilisateur dans une ligue (réservé au créateur côté backend). */
  const sendInvite = useCallback(async (leagueId: number, receiverId: number) => {
    await api.post("/api/league/invite/", {
      league_id: leagueId,
      receiver_id: receiverId,
    });
  }, []);

  const acceptInvitation = useCallback(
    async (id: number) => {
      await api.post(`/api/league/invitations/${id}/accept/`);
      await load();
    },
    [load],
  );

  const declineInvitation = useCallback(
    async (id: number) => {
      await api.post(`/api/league/invitations/${id}/decline/`);
      await load();
    },
    [load],
  );

  return {
    myLeagues,
    publicLeagues,
    invitations,
    loading,
    createLeague,
    leaveLeague,
    sendInvite,
    acceptInvitation,
    declineInvitation,
    reload: load,
  };
}

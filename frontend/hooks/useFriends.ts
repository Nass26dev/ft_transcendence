"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";

export interface FriendUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string;
}

export interface FriendEntry {
  friendship_id: number;
  user: FriendUser;
}

export type RelationStatus =
  | "none"
  | "friends"
  | "pending_sent"
  | "pending_received";

export interface SearchUser extends FriendUser {
  status: RelationStatus;
  friendship_id: number | null;
}

/** Recherche des joueurs par pseudo/email (statut de relation inclus). */
export async function searchUsers(q: string): Promise<SearchUser[]> {
  const res = await api.get<SearchUser[]>("/api/friends/search/", {
    params: { q },
  });
  return res.data;
}

/** Amis + demandes (reçues/envoyées) + actions. */
export function useFriends() {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/friends/");
      setFriends(res.data.friends ?? []);
      setIncoming(res.data.incoming ?? []);
      setOutgoing(res.data.outgoing ?? []);
    } catch (err) {
      console.error("Erreur chargement amis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendRequest = useCallback(
    async (receiverId: number) => {
      await api.post("/api/friends/request/", { receiver_id: receiverId });
      await load();
    },
    [load],
  );

  const accept = useCallback(
    async (friendshipId: number) => {
      await api.put(`/api/friends/request/${friendshipId}/accept/`);
      await load();
    },
    [load],
  );

  const decline = useCallback(
    async (friendshipId: number) => {
      await api.delete(`/api/friends/request/${friendshipId}/decline/`);
      await load();
    },
    [load],
  );

  const removeFriend = useCallback(
    async (friendshipId: number) => {
      await api.delete(`/api/friends/request/${friendshipId}/delete/`);
      await load();
    },
    [load],
  );

  return {
    friends,
    incoming,
    outgoing,
    loading,
    reload: load,
    sendRequest,
    accept,
    decline,
    removeFriend,
  };
}

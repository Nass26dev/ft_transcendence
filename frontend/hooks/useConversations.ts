"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { Conversation } from "@/utils/chat";

/** Liste des conversations DM de l'utilisateur + ouverture/création d'une DM. */
export function useConversations() {
  const { isAuthenticated, ready } = useProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Conversation[]>("/api/chat/conversations/");
      setConversations(res.data ?? []);
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [ready, isAuthenticated, load]);

  /** Récupère (ou crée) la conversation avec un utilisateur ; renvoie son objet
   *  et met à jour la liste locale si la conversation est nouvelle. */
  const openConversation = useCallback(
    async (userId: number): Promise<Conversation> => {
      const res = await api.post<Conversation>("/api/chat/conversations/", {
        user_id: userId,
      });
      setConversations((prev) =>
        prev.some((c) => c.id === res.data.id) ? prev : [res.data, ...prev],
      );
      return res.data;
    },
    [],
  );

  return { conversations, loading, reload: load, openConversation };
}

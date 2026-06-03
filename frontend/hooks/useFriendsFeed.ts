"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { ApiFriendFeedItem } from "@/utils/types";

/** Activité récente des amis (« le feed des potes »). */
export function useFriendsFeed() {
  const { isAuthenticated, ready } = useProfile();
  const [items, setItems] = useState<ApiFriendFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiFriendFeedItem[]>("/api/friends/feed/");
      setItems(res.data ?? []);
    } catch (err) {
      console.error("Erreur chargement feed des amis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [ready, isAuthenticated, load]);

  return { items, loading, reload: load };
}

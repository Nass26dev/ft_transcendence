"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import type { ApiBadge } from "@/utils/types";

/** Badges de l'utilisateur (débloqués au passage côté backend). */
export function useBadges() {
  const { isAuthenticated, ready } = useProfile();
  const [badges, setBadges] = useState<ApiBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiBadge[]>("/api/badges/");
      setBadges(res.data);
    } catch (err) {
      console.error("Erreur chargement badges:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setBadges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [ready, isAuthenticated, load]);

  return { badges, loading };
}

"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useProfile, type WheelSegment } from "@/app/(app)/_components/ProfileProvider";

/** Charge la configuration de la roue (cases) depuis l'API. */
export function useWheel() {
  const { isAuthenticated, ready } = useProfile();
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !isAuthenticated) {
      setLoading(false);
      return;
    }
    api
      .get<{ segments: WheelSegment[]; available: boolean }>("/api/wheel/")
      .then((res) => setSegments(res.data.segments))
      .catch((err) => console.error("Erreur chargement roue:", err))
      .finally(() => setLoading(false));
  }, [ready, isAuthenticated]);

  return { segments, loading };
}

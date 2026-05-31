"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import type { TrendingBet } from "@/utils/types";

/** Charge les paris les plus pris récemment (« Tendances Kop »). Public. */
export function useTrending() {
  const [trending, setTrending] = useState<TrendingBet[]>([]);

  useEffect(() => {
    api
      .get<TrendingBet[]>("/api/betting/trending/")
      .then((res) => setTrending(res.data))
      .catch((err) => console.error("Erreur chargement tendances:", err));
  }, []);

  return { trending };
}

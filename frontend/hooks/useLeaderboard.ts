"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import type { ApiLeaderboardEntry, LeagueBoardEntry } from "@/utils/types";
import type { ScopeKey } from "@/app/(app)/leaderboard/_components/ScopeTabs";
import type { PeriodKey } from "@/app/(app)/leaderboard/_components/PeriodTabs";

/** Format compact signé pour la variation hebdo : 1234 -> "+1.2k", -340 -> "-340". */
function formatDelta(n: number): string {
  const rounded = Math.round(n);
  if (rounded === 0) return "0";
  const sign = rounded > 0 ? "+" : "-";
  const abs = Math.abs(rounded);
  const body =
    abs >= 1000
      ? (abs / 1000).toFixed(1).replace(/\.0$/, "") + "k"
      : String(abs);
  return sign + body;
}

/** Classement des joueurs pour une période et une portée données. */
export function useLeaderboard(period: PeriodKey, scope: ScopeKey) {
  const [entries, setEntries] = useState<LeagueBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/api/leaderboard/", { params: { period, scope } })
      .then((res) => {
        if (cancelled) return;
        const raw: ApiLeaderboardEntry[] = res.data?.entries ?? [];
        setEntries(
          raw.map((e) => ({
            rank: e.rank,
            user: e.username,
            handle: "@" + e.username,
            kops: Math.round(e.net),
            weekDelta: formatDelta(e.week_net),
            wr: `${e.win_rate}%`,
            me: e.me,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) console.error("Erreur classement:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, scope]);

  return { entries, loading };
}

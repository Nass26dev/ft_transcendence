import React from "react";
import { motion } from "framer-motion";
import { LeaderboardRow } from "./LeaderboardRow";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import type { LeagueBoardEntry } from "@/utils/types";

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4A8DFF",
  "#A3FF12",
  "#FFD60A",
  "#C9184A",
  "#5F1E92",
  "#2FAEE0",
  "#E11A22",
];

export function LeaderboardTable({ entries }: { entries: LeagueBoardEntry[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[50px_1fr_100px_100px_110px] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            <span>#</span>
            <span>Joueur</span>
            <span className="text-right">Win rate</span>
            <span className="text-right">Cette sem.</span>
            <span className="text-right">Total</span>
          </div>

          <motion.div
            key={entries.length}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {entries.map((r) => (
              <motion.div key={r.rank} variants={staggerItem}>
                <LeaderboardRow
                  r={r}
                  avatarColor={AVATAR_COLORS[r.rank - 1] || "#5F1E92"}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

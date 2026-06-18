"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { MatchCard } from "@/components/match/MatchCard";
import { SectionHead } from "./SectionHead";
import { GhostBtn } from "./GhostBtn";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import type { Match, MatchHandlers } from "@/utils/types";

interface UpcomingSectionProps extends MatchHandlers {
  matches: Match[];
}

export function UpcomingSection({
  matches,
  onPick,
  isPicked,
  onOpen,
}: UpcomingSectionProps) {
  return (
    <>
      <SectionHead
        title="Les prochains gros matchs"
        sub="Championnats majeurs · 7 prochains jours"
        action={
          <GhostBtn href="/matches">
            Tous les matchs <Icon name="chevron" size={12} />
          </GhostBtn>
        }
      />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {matches.length === 0 ? (
          <div className="col-span-full rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
            Aucun match à venir dans les grands championnats.
          </div>
        ) : (
          matches.slice(0, 4).map((m) => (
            <motion.div key={m.id} variants={staggerItem}>
              <MatchCard
                match={m}
                onPick={onPick}
                isPicked={isPicked}
                onOpen={onOpen}
              />
            </motion.div>
          ))
        )}
      </motion.div>
    </>
  );
}

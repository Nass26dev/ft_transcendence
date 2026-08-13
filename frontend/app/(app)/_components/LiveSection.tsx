"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { LiveTile } from "@/components/match/LiveTile";
import { LeagueFilterBar } from "@/components/match/LeagueFilterBar";
import { MatchCardSkeletonGrid } from "@/components/match/MatchSkeleton";
import { SectionHead } from "./SectionHead";
import { GhostBtn } from "./GhostBtn";
import { useLeagueFilter } from "@/hooks/useLeagueFilter";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import type { Match, MatchHandlers } from "@/utils/types";

interface LiveSectionProps extends MatchHandlers {
  matches: Match[];
  loading?: boolean;
}

/** Section « En direct » de l'accueil : matchs live filtrables par championnat. */
export function LiveSection({
  matches,
  loading,
  onPick,
  isPicked,
  onOpen,
}: LiveSectionProps) {
  const { filtered, leagues, active, setActive } = useLeagueFilter(matches);

  return (
    <>
      <SectionHead
        title={
          <>
            En direct <Tag kind="live">{loading ? "…" : `${filtered.length} matchs`}</Tag>
          </>
        }
        sub="Cotes mises à jour en temps réel"
        action={
          <GhostBtn href="/live">
            Tout voir <Icon name="chevron" size={12} />
          </GhostBtn>
        }
      />
      {loading ? (
        <div className="mb-6">
          <MatchCardSkeletonGrid count={2} />
        </div>
      ) : (
        <>
          <LeagueFilterBar
            leagues={leagues}
            active={active}
            onChange={setActive}
            className="mb-4"
          />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {filtered.length === 0 ? (
              <div className="col-span-full rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
                Aucun match en direct pour le moment.
              </div>
            ) : (
              filtered.map((m) => (
                <motion.div key={m.id} variants={staggerItem}>
                  <LiveTile
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
      )}
    </>
  );
}

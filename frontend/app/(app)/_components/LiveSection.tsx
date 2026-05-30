"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { LiveTile } from "@/components/match/LiveTile";
import { SectionHead } from "./SectionHead";
import { GhostBtn } from "./GhostBtn";
import type { Match, MatchHandlers } from "@/utils/types";

interface LiveSectionProps extends MatchHandlers {
  matches: Match[];
  onNav?: (route: string) => void;
}

export function LiveSection({
  matches,
  onPick,
  isPicked,
  onOpen,
  onNav,
}: LiveSectionProps) {
  return (
    <>
      <SectionHead
        title={
          <>
            En direct <Tag kind="live">{matches.length} matchs</Tag>
          </>
        }
        sub="Cotes mises à jour en temps réel"
        action={
          <GhostBtn onClick={() => onNav?.("live")}>
            Tout voir <Icon name="chevron" size={12} />
          </GhostBtn>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4">
        {matches.length === 0 ? (
          <div className="col-span-2 rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
            Aucun match en direct pour le moment.
          </div>
        ) : (
          matches.map((m) => (
            <LiveTile
              key={m.id}
              match={m}
              onPick={onPick}
              isPicked={isPicked}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </>
  );
}

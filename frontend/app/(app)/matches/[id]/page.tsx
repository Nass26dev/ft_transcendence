"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { buildMatchDetail } from "@/utils/matchDetail";
import type { Match } from "@/utils/types";
import { MatchHero } from "./_components/MatchHero";
import { MarketsGrid } from "./_components/MarketsGrid";
import { MatchStats } from "./_components/MatchStats";
import { FriendsProno } from "./_components/FriendsProno";

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const handlePick = (_match: Match, _k: string, _label?: string) => {
    console.log("pick", _match.id, _k, _label);
  };

  const isPicked = (_mId: string, _k: string) => false;

  const detail = buildMatchDetail(params.id);

  if (!detail) {
    return (
      <div className="max-w-[1480px] px-8 pb-15 pt-7 text-text-3">
        Match introuvable.
      </div>
    );
  }

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3"
      >
        <span className="inline-block rotate-180">
          <Icon name="chevron" size={12} />
        </span>
        Retour
      </button>

      <MatchHero detail={detail} />

      <div className="flex items-start gap-4">
        <MarketsGrid detail={detail} onPick={handlePick} isPicked={isPicked} />

        <aside className="flex w-[320px] flex-none flex-col gap-4">
          <MatchStats />
          <FriendsProno />
        </aside>
      </div>
    </div>
  );
}

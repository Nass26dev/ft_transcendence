"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { useBetSlipHandlers } from "../../_components/BetSlipProvider";
import { MatchHero } from "./_components/MatchHero";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { match } = useMatchDetail(id);
  const handlers = useBetSlipHandlers();

  return (
    <div className="max-w-[1480px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
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

      {match ? (
        <MatchHero match={match} {...handlers} />
      ) : (
        <div className="text-sm text-text-3">Chargement du match…</div>
      )}
    </div>
  );
}

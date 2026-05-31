import React from "react";
import { Kops } from "@/components/ui/Kops";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ApiChallenge } from "@/utils/types";

interface Props {
  c: ApiChallenge;
  onClaim: (code: string) => void;
  claiming: boolean;
}

export function SeasonChallengeCard({ c, onClaim, claiming }: Props) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4.5">
      <div className="mb-1 text-[13px] font-semibold">{c.title}</div>
      <div className="mb-3.5 text-xs text-text-3">{c.description}</div>
      <ProgressBar progress={c.progress} total={c.target} />
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] text-text-3">
          {c.progress} / {c.target}
        </span>
        <Kops amount={c.reward} size={13} color="var(--green)" />
      </div>

      {c.claimed ? (
        <div className="mt-3 text-center text-[12px] font-semibold text-text-3">Récupéré ✓</div>
      ) : c.completed ? (
        <button
          onClick={() => onClaim(c.code)}
          disabled={claiming}
          className="mt-3 w-full rounded-[8px] bg-kop px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          Récupérer la récompense
        </button>
      ) : null}
    </div>
  );
}

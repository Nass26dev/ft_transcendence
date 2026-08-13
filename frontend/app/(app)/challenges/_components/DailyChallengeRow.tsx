import React from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ApiChallenge } from "@/utils/types";

interface Props {
  c: ApiChallenge;
  onClaim: (code: string) => void;
  claiming: boolean;
}

/** Ligne d'un défi quotidien : icône, progression et bouton de récupération une fois complété. */
export function DailyChallengeRow({ c, onClaim, claiming }: Props) {
  return (
    <div className="flex items-center gap-3.5 rounded-[10px] border border-border bg-surface-1 p-3.5">
      <div className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border border-border bg-surface-2 text-[22px]">
        {c.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{c.title}</div>
        <div className="mt-0.5 text-xs text-text-3">{c.description}</div>
        <div className="mt-2">
          <ProgressBar progress={c.progress} total={c.target} />
        </div>
        <div className="mt-1.5 text-[11px] text-text-3">
          {c.progress} / {c.target}
        </div>
      </div>

      <div className="flex-none text-right">
        {c.claimed ? (
          <span className="text-[12.5px] font-semibold text-text-3">Récupéré ✓</span>
        ) : c.completed ? (
          <button
            onClick={() => onClaim(c.code)}
            disabled={claiming}
            className="rounded-[8px] bg-kop px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            Récupérer +{c.reward}
          </button>
        ) : (
          <>
            <div className="font-display text-base font-bold text-green">+{c.reward}</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-3">
              Kops
            </div>
          </>
        )}
      </div>
    </div>
  );
}

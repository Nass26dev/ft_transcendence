import React from "react";
import { Kops } from "@/components/ui/Kops";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SeasonChallenge } from "@/utils/types";

export function SeasonChallengeCard({ c }: { c: SeasonChallenge }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4.5">
      <div className="mb-1 text-[13px] font-semibold">{c.ttl}</div>
      <div className="mb-3.5 text-xs text-text-3">{c.desc}</div>
      <ProgressBar progress={c.progress} total={c.total} />
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] text-text-3">
          {c.progress} / {c.total}
        </span>
        <Kops amount={c.reward} size={13} color="var(--green)" />
      </div>
    </div>
  );
}

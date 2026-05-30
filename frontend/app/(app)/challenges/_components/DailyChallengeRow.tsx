import React from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Challenge } from "@/utils/types";

export function DailyChallengeRow({ c }: { c: Challenge }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[10px] border border-border bg-surface-1 p-3.5">
      <div className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border border-border bg-surface-2 text-[22px]">
        {c.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{c.ttl}</div>
        <div className="mt-0.5 text-xs text-text-3">{c.desc}</div>
        <div className="mt-2">
          <ProgressBar progress={c.progress} total={c.total} />
        </div>
        <div className="mt-1.5 text-[11px] text-text-3">
          {c.progress} / {c.total}
        </div>
      </div>

      <div className="flex-none text-right">
        <div className="font-display text-base font-bold text-green">
          +{c.reward}
        </div>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-3">
          Kops
        </div>
      </div>
    </div>
  );
}

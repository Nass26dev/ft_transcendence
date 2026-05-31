import React from "react";
import { Tag } from "@/components/ui/Tag";

export function ProfileHero() {
  return (
    <div className="mb-6 rounded-[10px] border border-border bg-gradient-to-br from-[#1A0808] to-surface-1 p-7">
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="grid h-20 w-20 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[28px] font-bold">
          YO
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em]">
            Yohann Lefèvre
          </h1>
          <div className="mt-1 text-[13px] text-text-3">
            @you · Membre depuis sept. 2025
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag kind="green">Niveau 12 · Pronostiqueur</Tag>
            <Tag>Lyon, FR</Tag>
            <Tag>3 ligues</Tag>
          </div>
        </div>

        {/* Balance */}
        <div className="flex-none text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Solde
          </div>
          <div className="font-display tnum text-4xl font-bold text-kop-bright">
            52 300
          </div>
          <div className="text-xs text-text-3">Kops</div>
        </div>
      </div>
    </div>
  );
}

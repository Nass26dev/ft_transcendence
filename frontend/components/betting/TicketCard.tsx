"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { Kops } from "@/components/ui/Kops";
import type { Bet, BetStatus } from "@/utils/types";

interface TicketCardProps {
  bet: Bet;
}

const STATUS_COLOR: Record<BetStatus, string> = {
  won: "var(--green)",
  lost: "var(--kop-bright)",
  pending: "var(--text-2)",
};

const STATUS_LABEL: Record<BetStatus, string> = {
  won: "Gagné",
  lost: "Perdu",
  pending: "En cours",
};

const STATUS_TAG_KIND = (s: BetStatus) =>
  s === "won" ? "green" : s === "lost" ? "default" : "soon";

const PAYOUT_LABEL: Record<BetStatus, string> = {
  won: "Encaissé",
  lost: "Perdu",
  pending: "Gain potentiel",
};

export function TicketCard({ bet }: TicketCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4.5">
      {/* Head */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Tag>{bet.kind}</Tag>
          <span className="text-xs text-text-3">{bet.date}</span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="font-mono tnum text-[13px] font-bold text-text-3">
            ×{bet.odd.toFixed(2)}
          </span>
          <Tag kind={STATUS_TAG_KIND(bet.status)}>
            {STATUS_LABEL[bet.status]}
          </Tag>
        </div>
      </div>

      {/* Picks */}
      <div className="mb-3.5 flex flex-col gap-2">
        {bet.picks.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5"
          >
            <PickStatusIcon status={p.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-text-3">{p.match}</div>
              <div className="text-[13.5px] font-semibold">{p.pick}</div>
            </div>
            <span className="font-mono tnum text-[13px] font-bold">
              {p.odd.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="text-[13px]">
          <span className="text-text-3">Mise </span>
          <Kops amount={bet.stake} size={13} />
        </div>
        <div className="text-sm">
          <span className="text-xs text-text-3">
            {PAYOUT_LABEL[bet.status]}{" "}
          </span>
          <Kops
            amount={bet.payout}
            size={16}
            color={STATUS_COLOR[bet.status]}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Sub ----------

function PickStatusIcon({ status }: { status: BetStatus }) {
  if (status === "won") {
    return (
      <div className="grid h-[22px] w-[22px] place-items-center rounded-full bg-green/15 text-green">
        <Icon name="check" size={12} stroke={3} />
      </div>
    );
  }
  if (status === "lost") {
    return (
      <div className="grid h-[22px] w-[22px] place-items-center rounded-full bg-kop/15 text-kop-bright">
        <Icon name="x" size={12} stroke={3} />
      </div>
    );
  }
  return (
    <div className="grid h-[22px] w-[22px] place-items-center rounded-full bg-surface-3 text-text-3">
      ·
    </div>
  );
}
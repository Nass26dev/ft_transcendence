"use client";

import React from "react";
import type { MatchEvent, MatchEventType } from "@/utils/types";

function EventIcon({ type }: { type: MatchEventType }) {
  switch (type) {
    case "goal":
    case "penalty":
      return <span className="text-sm leading-none">⚽</span>;
    case "own_goal":
      return <span className="text-sm leading-none grayscale">⚽</span>;
    case "yellow_card":
      return <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-[#f5c518]" />;
    case "red_card":
      return <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-kop-bright" />;
    case "substitution":
      return <span className="text-[11px] font-bold leading-none text-green">⇄</span>;
    default:
      return null;
  }
}

/** Libellé secondaire (csc, pen, joueur sortant). */
function eventDetail(ev: MatchEvent): string | null {
  if (ev.type === "substitution" && ev.player_out) return ev.player_out;
  if (ev.type === "own_goal") return "csc";
  if (ev.type === "penalty") return "pen.";
  return null;
}

function EventSide({ ev, side }: { ev: MatchEvent; side: "home" | "away" }) {
  const mine = ev.team_side === side;
  if (!mine) return <div className="flex-1" />;
  const detail = eventDetail(ev);
  const goal = ev.type === "goal" || ev.type === "penalty" || ev.type === "own_goal";
  return (
    <div
      className={[
        "flex flex-1 items-center gap-2",
        side === "home" ? "justify-end text-right" : "justify-start text-left flex-row-reverse",
      ].join(" ")}
    >
      <EventIcon type={ev.type} />
      <span className="min-w-0">
        <span className={["truncate text-[13px]", goal ? "font-bold" : "font-medium"].join(" ")}>
          {ev.player}
        </span>
        {detail && (
          <span className="ml-1 text-[11.5px] text-text-3">
            {ev.type === "substitution" ? `↓ ${detail}` : `(${detail})`}
          </span>
        )}
      </span>
    </div>
  );
}

export function MatchTimeline({ events }: { events: MatchEvent[] }) {
  if (!events.length) return null;

  return (
    <section className="rounded-[12px] border border-border bg-surface-1 p-4 sm:p-6">
      <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-3">
        Faits du match
      </h2>
      <div className="flex flex-col gap-2.5">
        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-3">
            <EventSide ev={ev} side="home" />
            <span className="tnum w-10 shrink-0 text-center text-[11.5px] font-semibold text-text-3">
              {ev.minute != null ? `${ev.minute}'` : "-"}
            </span>
            <EventSide ev={ev} side="away" />
          </div>
        ))}
      </div>
    </section>
  );
}

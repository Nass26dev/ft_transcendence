import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { FormBadge } from "./FormBadge";
import type { MatchDetail } from "@/utils/matchDetail";

export function MatchHero({ detail }: { detail: MatchDetail }) {
  const { match, lg, home, away, isLive, homeForm, awayForm } = detail;

  return (
    <div className="mb-6 rounded-[14px] border border-border bg-gradient-to-b from-[#1A0808] to-surface-1 p-7">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive ? (
            <Tag kind="live">{match.minute}&apos;</Tag>
          ) : (
            <Tag kind="soon">À venir</Tag>
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">
            {lg.flag} {lg.n} · J 14
          </span>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3">
          <Icon name="star" size={14} /> Suivre
        </button>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        {/* Home */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div
            className="grid h-[72px] w-[72px] place-items-center rounded-full font-display text-2xl font-bold"
            style={{
              background: home.c,
              color: home.t,
              border: home.c === "#FFFFFF" ? "1px solid var(--border)" : "none",
            }}
          >
            {home.sh.slice(0, 3)}
          </div>
          <div className="text-base font-semibold">{home.n}</div>
          <div className="mt-1 flex gap-1">
            {homeForm.map((r, i) => (
              <FormBadge key={i} r={r} />
            ))}
          </div>
        </div>

        {/* VS / Score */}
        <div className="text-center">
          {isLive ? (
            <>
              <div className="font-display tnum text-[56px] font-bold leading-none">
                {match.scoreH} − {match.scoreA}
              </div>
              <div className="mt-1.5 font-mono text-xs text-text-2">
                {match.minute}&apos; · 2e mi-temps
              </div>
            </>
          ) : (
            <>
              <div className="font-display text-sm font-semibold text-text-3">
                VS
              </div>
              <div className="mt-1.5 font-mono text-xs text-text-2">
                {match.kickoff}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
                Parc des Princes
              </div>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div
            className="grid h-[72px] w-[72px] place-items-center rounded-full font-display text-2xl font-bold"
            style={{
              background: away.c,
              color: away.t,
              border: away.c === "#FFFFFF" ? "1px solid var(--border)" : "none",
            }}
          >
            {away.sh.slice(0, 3)}
          </div>
          <div className="text-base font-semibold">{away.n}</div>
          <div className="mt-1 flex gap-1">
            {awayForm.map((r, i) => (
              <FormBadge key={i} r={r} />
            ))}
          </div>
        </div>
      </div>

      {/* Confidence inline */}
      {match.conf && (
        <div className="mt-6 rounded-lg bg-surface-2 px-4 py-3.5">
          <div className="mb-2 flex justify-between text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
            <span>Confiance des Kopistes · 12 480 paris</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="chart" size={12} /> Sentiment
            </span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-surface-3">
            <div
              className="h-full bg-kop transition-[width] duration-300"
              style={{ width: `${match.conf["1"]}%` }}
            />
            <div
              className="h-full bg-text-4 transition-[width] duration-300"
              style={{ width: `${match.conf["X"]}%` }}
            />
            <div
              className="h-full bg-blue transition-[width] duration-300"
              style={{ width: `${match.conf["2"]}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] font-semibold text-text-3">
            <span>
              {match.conf["1"]} % · {home.sh}
            </span>
            <span>{match.conf["X"]} % · Nul</span>
            <span>
              {match.conf["2"]} % · {away.sh}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

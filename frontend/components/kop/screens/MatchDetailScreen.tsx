"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/kop/ui/Icon";
import { Tag } from "@/components/kop/ui/Tag";
import {
  TEAMS,
  LEAGUES,
  MATCHES,
  LIVE,
  FRIENDS_FEED,
} from "@/data/kop-data";
import type { Match, MatchHandlers } from "@/utils/types";

interface MatchDetailScreenProps extends MatchHandlers {
  matchId: string;
}

interface MarketOption {
  k: string;
  label: string;
  v: number;
}

interface Market {
  ttl: string;
  count: number;
  opts: MarketOption[];
}

// ---------- Form helper ----------

type FormResult = "W" | "D" | "L";

function FormBadge({ r }: { r: FormResult }) {
  const styles = {
    W: "bg-green text-black",
    D: "bg-text-3 text-white",
    L: "bg-kop text-white",
  } as const;
  return (
    <span
      className={`grid h-[18px] w-[18px] place-items-center rounded text-[10px] font-bold ${styles[r]}`}
    >
      {r}
    </span>
  );
}

// ---------- Component ----------

export function MatchDetailScreen({
  matchId,
  onPick,
  isPicked,
}: MatchDetailScreenProps) {
  const router = useRouter();

  const match = [...MATCHES, ...LIVE].find((m) => m.id === matchId);

  if (!match) {
    return (
      <div className="max-w-[1480px] px-8 pb-15 pt-7 text-text-3">
        Match introuvable.
      </div>
    );
  }

  const lg = LEAGUES[match.league];
  const isLive = !!match.minute;
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];

  const markets: Market[] = [
    {
      ttl: "Vainqueur du match",
      count: 3,
      opts: [
        { k: "1", label: home.n, v: match.odds["1"] },
        { k: "X", label: "Match nul", v: match.odds["X"] },
        { k: "2", label: away.n, v: match.odds["2"] },
      ],
    },
    {
      ttl: "Total de buts",
      count: 2,
      opts: [
        { k: "O25", label: "Plus de 2.5", v: 1.85 },
        { k: "U25", label: "Moins de 2.5", v: 1.95 },
      ],
    },
    {
      ttl: "Les deux équipes marquent",
      count: 2,
      opts: [
        { k: "BTTSY", label: "Oui", v: 1.75 },
        { k: "BTTSN", label: "Non", v: 2.05 },
      ],
    },
    {
      ttl: "Score exact (sélection)",
      count: 3,
      opts: [
        { k: "21", label: "2 − 1", v: 8.5 },
        { k: "10", label: "1 − 0", v: 7.0 },
        { k: "11", label: "1 − 1", v: 6.5 },
      ],
    },
  ];

  const homeForm: FormResult[] = ["W", "W", "D", "L", "W"];
  const awayForm: FormResult[] = ["L", "W", "W", "W", "D"];

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

      {/* ============= HERO ============= */}
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
                border:
                  home.c === "#FFFFFF" ? "1px solid var(--border)" : "none",
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
                border:
                  away.c === "#FFFFFF" ? "1px solid var(--border)" : "none",
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

      {/* ============= MAIN ROW ============= */}
      <div className="flex items-start gap-4">
        {/* Markets */}
        <div className="min-w-0 flex-1">
          <div className="mb-3.5">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
              Marchés
            </h2>
            <div className="mt-0.5 text-[13px] text-text-3">
              {markets.length} catégories · 24 cotes
            </div>
          </div>

          <div className="grid gap-3">
            {markets.map((m, i) => (
              <div
                key={i}
                className="rounded-[10px] border border-border bg-surface-1"
              >
                <div className="flex items-center justify-between px-4.5 py-3.5">
                  <span className="text-sm font-semibold">{m.ttl}</span>
                  <span className="text-[11.5px] font-medium text-text-3">
                    {m.count} options
                  </span>
                </div>
                <div
                  className={`grid gap-2.5 px-4.5 pb-4.5 ${
                    m.count === 2 ? "grid-cols-2" : "grid-cols-3"
                  }`}
                >
                  {m.opts.map((o) => (
                    <div
                      key={o.k}
                      data-odd-pill
                      onClick={() =>
                        onPick(
                          {
                            ...match,
                            odds: { ...match.odds, [o.k]: o.v } as Match["odds"],
                          },
                          o.k,
                          o.label,
                        )
                      }
                      className={[
                        "flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3.5 transition-all",
                        isPicked(match.id, o.k)
                          ? "border-kop-bright bg-kop text-white shadow-[0_0_0_1px_var(--kop-bright),0_6px_18px_-6px_var(--kop)]"
                          : "border-border bg-surface-2 hover:border-kop hover:text-text",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-[11.5px] font-semibold uppercase tracking-[0.05em]",
                          isPicked(match.id, o.k)
                            ? "text-white/75"
                            : "text-text-3",
                        ].join(" ")}
                      >
                        {o.label}
                      </span>
                      <span className="font-mono tnum text-[15px] font-bold">
                        {o.v.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <aside className="flex w-[320px] flex-none flex-col gap-4">
          {/* Stats clés */}
          <div className="rounded-[10px] border border-border bg-surface-1 p-5">
            <h3 className="mb-3 font-display text-base font-bold">
              Stats clés
            </h3>
            {(
              [
                ["Forme (5 derniers)", "8 pts", "7 pts"],
                ["Buts marqués / match", "2.4", "1.8"],
                ["Buts encaissés / match", "0.9", "1.3"],
                ["Confrontations directes", "6 V", "2 V"],
              ] as const
            ).map(([lbl, h, a], i, arr) => (
              <div
                key={i}
                className={[
                  "flex items-center justify-between py-2 text-[13px]",
                  i < arr.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                <span className="min-w-[36px] text-left font-mono tnum font-bold">
                  {h}
                </span>
                <span className="flex-1 text-center text-[11.5px] text-text-3">
                  {lbl}
                </span>
                <span className="min-w-[36px] text-right font-mono tnum font-bold">
                  {a}
                </span>
              </div>
            ))}
          </div>

          {/* Pronos des potes */}
          <div className="rounded-[10px] border border-border bg-surface-1 p-5">
            <h3 className="mb-3 font-display text-base font-bold">
              Pronos des potes
            </h3>
            {FRIENDS_FEED.slice(0, 3).map((f, i, arr) => (
              <div
                key={f.id}
                className={[
                  "flex items-center gap-2.5 py-2",
                  i < arr.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                <div
                  className="grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-bold"
                  style={{
                    background: f.avatar,
                    color:
                      f.avatar === "#FFD60A" || f.avatar === "#A3FF12"
                        ? "#000"
                        : "#fff",
                  }}
                >
                  {f.user[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{f.user}</div>
                  <div className="truncate text-[11.5px] text-text-3">
                    {f.pick}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
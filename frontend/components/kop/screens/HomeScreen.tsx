"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@/components/kop/ui/Icon";
import { Tag } from "@/components/kop/ui/Tag";
import { Kops } from "@/components/kop/ui/Kops";
import { MatchCard } from "@/components/kop/match/MatchCard";
import { LiveTile } from "@/components/kop/match/LiveTile";
import api from '@/utils/api';
import {
  TRENDING,
  CHALLENGES,
  FRIENDS_FEED,
  LEAGUE_BOARD,
} from "@/data/kop-data";
import type { Match, PickHandlers } from "@/utils/types";

// Compétitions majeures à garder dans "prochains gros matchs"
const MAJOR_COMPETITIONS = [
  "Ligue 1",
  "Ligue 2",
  "Premier League",
  "Bundesliga",
  "La Liga",
  "Serie A",
  "Primeira Liga",
];

type Route =
  | "home" | "live" | "sports" | "tickets" | "leagues"
  | "leaderboard" | "challenges" | "profile" | "match";

interface HomeScreenProps extends PickHandlers {
  onNav: (route: Route) => void;
  friendsOn: boolean;
}

export function HomeScreen({
  onPick,
  isPicked,
  onOpen,
  onNav,
  friendsOn,
}: HomeScreenProps) {
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.all([
          api.get("/api/matches/live/"),
          api.get("/api/matches/upcoming/"),
        ]);

        setLive(liveRes.data);

        // filtre front : on ne garde que les championnats majeurs
        const major = (upcomingRes.data as Match[]).filter((m) =>
          MAJOR_COMPETITIONS.some((c) => m.competition.startsWith(c))
        );
        setUpcoming(major);
      } catch (err) {
        console.error("Erreur chargement matchs:", err);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-[1480px] px-8 pb-15 pt-7">
      {/* ============= HERO ============= (inchangé) */}
      <div className="relative mb-7 overflow-hidden rounded-[14px] border border-border bg-gradient-to-br from-[#1A0606] to-bg px-9 py-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,var(--kop)_0%,transparent_70%)] opacity-[0.18]" />
        <div className="relative grid grid-cols-[1fr_auto] items-center gap-8">
          <div>
            <div className="mb-3.5 inline-flex gap-2">
              <Tag kind="green">Saison 2025/26</Tag>
              <Tag>Choc du week-end</Tag>
            </div>
            <h1 className="mb-2.5 font-display text-[38px] font-bold leading-none tracking-[-0.03em]">
              Le Classique. <em className="not-italic text-kop-bright">Tes pronos.</em>
              <br />
              Aucune limite.
            </h1>
            <p className="max-w-[540px] text-[14.5px] leading-[1.5] text-text-2">
              Parie en Kops, défie tes potes, grimpe au classement. Pas un centime
              sorti, mais toute l&apos;adrénaline d&apos;un vrai stade.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => onOpen("m1")}
                className="inline-flex items-center gap-2 rounded-md bg-kop px-5 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright hover:shadow-[0_6px_22px_-8px_var(--kop)]"
              >
                Voir les cotes <Icon name="arrow" size={14} stroke={2.4} />
              </button>
              <button
                onClick={() => onNav("leagues")}
                className="rounded-md border border-border-strong bg-transparent px-5 py-3.5 text-[15px] font-semibold text-text transition-colors hover:bg-surface-1"
              >
                Créer une ligue
              </button>
            </div>
          </div>

          <div className="flex min-w-[280px] flex-col gap-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
              Tendances Kop
            </div>
            {TRENDING.map((t: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-black/35 px-3 py-2.5"
              >
                <Icon name="fire" size={16} stroke={1.8} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{t.tag}</div>
                  <div className="text-[11px] text-text-3">{t.vol}</div>
                </div>
                <span className="font-mono tnum font-bold text-green">
                  {t.odd.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============= MAIN ROW ============= */}
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {/* Live strip */}
          <SectionHead
            title={
              <>
                En direct <Tag kind="live">{live.length} matchs</Tag>
              </>
            }
            sub="Cotes mises à jour en temps réel"
            action={
              <GhostBtn onClick={() => onNav("live")}>
                Tout voir <Icon name="chevron" size={12} />
              </GhostBtn>
            }
          />
          <div className="mb-6 grid grid-cols-2 gap-4">
            {live.length === 0 ? (
              <div className="col-span-2 rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
                Aucun match en direct pour le moment.
              </div>
            ) : (
              live.map((m) => (
                <LiveTile
                  key={m.id}
                  match={m}
                  onPick={onPick}
                  isPicked={isPicked}
                  onOpen={onOpen}
                />
              ))
            )}
          </div>

          {/* Prochains gros matchs */}
          <SectionHead
            title="Les prochains gros matchs"
            sub="Championnats majeurs · 7 prochains jours"
            action={
              <GhostBtn onClick={() => onNav("sports")}>
                Tous les matchs <Icon name="chevron" size={12} />
              </GhostBtn>
            }
          />
          <div className="grid grid-cols-2 gap-4">
            {upcoming.length === 0 ? (
              <div className="col-span-2 rounded-lg border border-border bg-surface-1 px-4 py-6 text-center text-[13px] text-text-3">
                Aucun match à venir dans les grands championnats.
              </div>
            ) : (
              upcoming.slice(0, 4).map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onPick={onPick}
                  isPicked={isPicked}
                  onOpen={onOpen}
                />
              ))
            )}
          </div>
        </div>

        {/* ----- Right rail (inchangé, données fixes) ----- */}
        <aside className="flex w-[320px] flex-none flex-col gap-[18px]">
          <div className="rounded-[10px] border border-border bg-surface-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base">Défis du jour</h3>
              <GhostBtn onClick={() => onNav("challenges")}>Voir tout</GhostBtn>
            </div>
            <div className="flex flex-col gap-2.5">
              {CHALLENGES.slice(0, 2).map((c: any) => (
                <div key={c.id} className="rounded-lg bg-surface-2 p-3">
                  <div className="mb-1.5 flex justify-between">
                    <span className="text-[13px] font-semibold">
                      {c.icon} {c.ttl}
                    </span>
                    <Kops amount={c.reward} size={12} color="var(--green)" />
                  </div>
                  <div className="h-1 overflow-hidden rounded-[2px] bg-surface-3">
                    <div
                      className="h-full rounded-[2px] bg-green"
                      style={{ width: `${(c.progress / c.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] text-text-3">
                    {c.progress} / {c.total}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {friendsOn && (
            <div className="rounded-[10px] border border-border bg-surface-1">
              <div className="flex items-center justify-between border-b border-border p-3.5">
                <h3 className="font-display text-base">Le feed des potes</h3>
                <Tag kind="green">Live</Tag>
              </div>
              <div>
                {FRIENDS_FEED.slice(0, 5).map((f: any) => (
                  <div
                    key={f.id}
                    className="flex gap-2.5 border-b border-border px-3.5 py-3 last:border-b-0"
                  >
                    <div
                      className="grid h-8 w-8 flex-none place-items-center rounded-full text-[12px] font-bold"
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
                      <div className="text-[13px] font-semibold">
                        {f.user}{" "}
                        <span className="text-[11px] font-medium text-text-3">
                          · {f.when}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-text-3">
                        <span className="text-text-2">{f.desc}</span>{" "}
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              f.kind === "won" ? "var(--green)" : "var(--text)",
                          }}
                        >
                          {f.pick}
                        </span>
                      </div>
                      {f.kind === "won" && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Tag kind="green">Gagné</Tag>
                        </div>
                      )}
                      {f.kind === "combo" && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Tag>Combiné x4</Tag>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[10px] border border-border bg-surface-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base">Ta ligue</h3>
              <GhostBtn onClick={() => onNav("leagues")}>Ouvrir</GhostBtn>
            </div>
            <div className="mb-2.5 text-[12px] text-text-3">
              Les Kopistes du Mardi · 12 joueurs
            </div>
            {LEAGUE_BOARD.slice(0, 4).map((r: any) => (
              <div
                key={r.rank}
                className="flex items-center gap-2.5 border-b border-border py-2 text-[13px] last:border-b-0"
              >
                <span
                  className={[
                    "w-[22px] font-display text-sm font-bold",
                    r.rank === 1
                      ? "text-yellow"
                      : r.rank === 2
                        ? "text-[#C5C9D1]"
                        : r.rank === 3
                          ? "text-[#D88B5C]"
                          : "text-text-2",
                  ].join(" ")}
                >
                  {r.rank}
                </span>
                <span
                  className={[
                    "flex-1",
                    r.me ? "font-bold text-kop-bright" : "font-medium",
                  ].join(" ")}
                >
                  {r.user}
                </span>
                <Kops amount={r.kops} size={12} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHead({
  title,
  sub,
  action,
}: {
  title: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.02em]">
          {title}
        </h2>
        {sub && <div className="mt-0.5 text-[13px] text-text-3">{sub}</div>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3"
    >
      {children}
    </button>
  );
}
"use client";

import React from "react";
import type { MatchLineupPlayer, TeamSide } from "@/utils/types";

/** Formation supposée (le gardien est ajouté en tête). 4-3-3 par défaut. */
const FORMATION = [4, 3, 3];

/** Découpe les titulaires en lignes [gardien], [défense], [milieu], [attaque].
 *  foot-live ne donne pas les positions : l'ordre de la liste (GK puis lignes)
 *  sert d'approximation. */
function toLines(starters: MatchLineupPlayer[]): MatchLineupPlayer[][] {
  const gk = starters.slice(0, 1);
  const rest = starters.slice(1);
  const lines: MatchLineupPlayer[][] = [];
  let i = 0;
  for (const n of FORMATION) {
    lines.push(rest.slice(i, i + n));
    i += n;
  }
  if (i < rest.length && lines.length) lines[lines.length - 1].push(...rest.slice(i));
  return [gk, ...lines];
}

/** Nom court pour tenir sur le terrain : dernier mot du nom. */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function PlayerDot({ p, side }: { p: MatchLineupPlayer; side: TeamSide }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5" title={p.player}>
      <span
        className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] sm:h-8 sm:w-8 sm:text-[12px]"
        style={{ background: side === "home" ? "var(--kop)" : "var(--blue)" }}
      >
        {p.number ?? ""}
      </span>
      <span
        className="max-w-[68px] truncate text-[9.5px] font-medium leading-tight text-white/95 sm:text-[10.5px]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
      >
        {shortName(p.player)}
      </span>
    </div>
  );
}

function Row({ players, side }: { players: MatchLineupPlayer[]; side: TeamSide }) {
  if (!players.length) return <div className="flex-1" />;
  return (
    <div className="flex flex-1 items-center justify-around px-2">
      {players.map((p, i) => (
        <PlayerDot key={i} p={p} side={side} />
      ))}
    </div>
  );
}

function Pitch({
  home,
  away,
}: {
  home: MatchLineupPlayer[];
  away: MatchLineupPlayer[];
}) {
  // away en haut (lignes du gardien vers l'attaque), home en bas (miroir).
  const [aGk, aDef, aMid, aFwd] = toLines(away);
  const [hGk, hDef, hMid, hFwd] = toLines(home);

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-[12px] border border-border sm:aspect-[4/5]"
      style={{
        background:
          "repeating-linear-gradient(0deg, #2c7a4d 0px, #2c7a4d 11%, #29723f 11%, #29723f 22%)",
      }}
    >
      {/* Marquages */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 right-0 top-1/2 border-t border-white/30" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
        <div className="absolute left-1/2 top-0 h-[12%] w-2/5 -translate-x-1/2 rounded-b-sm border border-t-0 border-white/30" />
        <div className="absolute bottom-0 left-1/2 h-[12%] w-2/5 -translate-x-1/2 rounded-t-sm border border-b-0 border-white/30" />
      </div>

      {/* Joueurs */}
      <div className="relative flex h-full flex-col py-2">
        <Row players={aGk} side="away" />
        <Row players={aDef} side="away" />
        <Row players={aMid} side="away" />
        <Row players={aFwd} side="away" />
        <Row players={hFwd} side="home" />
        <Row players={hMid} side="home" />
        <Row players={hDef} side="home" />
        <Row players={hGk} side="home" />
      </div>
    </div>
  );
}

function SubsColumn({
  name,
  subs,
  side,
}: {
  name: string | undefined;
  subs: MatchLineupPlayer[];
  side: TeamSide;
}) {
  if (!subs.length) return null;
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5 truncate text-[12px] font-bold">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: side === "home" ? "var(--kop)" : "var(--blue)" }}
        />
        {name}
      </div>
      <ul className="flex flex-col">
        {subs.map((p, i) => (
          <li key={i} className="flex items-center gap-2.5 py-0.5 text-[12.5px]">
            <span className="tnum w-5 shrink-0 text-center text-[11px] font-semibold text-text-3">
              {p.number ?? "–"}
            </span>
            <span className="truncate text-text-2">{p.player}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface MatchLineupsProps {
  lineups: MatchLineupPlayer[];
  homeName?: string;
  awayName?: string;
}

export function MatchLineups({ lineups, homeName, awayName }: MatchLineupsProps) {
  if (!lineups.length) return null;
  const pick = (side: TeamSide, role: "starter" | "substitute") =>
    lineups.filter((p) => p.team_side === side && p.role === role);

  const homeXI = pick("home", "starter");
  const awayXI = pick("away", "starter");
  const hasXI = homeXI.length > 0 && awayXI.length > 0;

  return (
    <section className="rounded-[12px] border border-border bg-surface-1 p-4 sm:p-6">
      <h2 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-3">
        Compositions
      </h2>

      {hasXI && (
        <>
          <p className="mb-3 text-[11px] text-text-4">
            Disposition indicative (4-3-3) : foot-live ne fournit pas les postes.
          </p>
          <div className="mx-auto max-w-[460px]">
            <Pitch home={homeXI} away={awayXI} />
          </div>
        </>
      )}

      {(pick("home", "substitute").length > 0 ||
        pick("away", "substitute").length > 0) && (
        <>
          <div className="mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Remplaçants
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <SubsColumn name={homeName} subs={pick("home", "substitute")} side="home" />
            <SubsColumn name={awayName} subs={pick("away", "substitute")} side="away" />
          </div>
        </>
      )}
    </section>
  );
}

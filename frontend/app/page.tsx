"use client";

import React from "react";

// Externes — adapte les chemins quand tu m'enverras les fichiers
import { Sidebar } from "@/components/kop/Sidebar";
import { Topbar } from "@/components/kop/Topbar";
import { BetSlip } from "@/components/kop/Slip";
import { Onboarding } from "@/components/kop/Onboarding";
import {
  HomeScreen,
  LiveScreen,
  SportsScreen,
} from "@/components/kop/Screens-a";
import {
  MatchDetail,
  TicketsScreen,
  LeaguesScreen,
  ChallengesScreen,
  ProfileScreen,
} from "@/components/kop/Screens-b";
import { TEAMS, MATCHES, LIVE } from "@/data/kop-data";

// ---------- Types ----------

type Route =
  | "home"
  | "live"
  | "sports"
  | "tickets"
  | "leagues"
  | "leaderboard"
  | "challenges"
  | "profile"
  | "match";

type PickKey = "1" | "X" | "2" | string;

interface Match {
  id: string;
  home: string;
  away: string;
  odds: Record<string, number>;
  // autres champs côté data (any toléré)
  [k: string]: any;
}

interface Pick {
  id: string;
  matchId: string;
  k: PickKey;
  game: string;
  label: string;
  odd: number;
}

interface PlacePayload {
  stake: number;
  payout: number;
}

interface Toast {
  type: "ok" | "err";
  msg: string;
}

interface Tweaks {
  friendsFeed: boolean;
}

// ---------- Defaults ----------

const TWEAK_DEFAULTS: Tweaks = /*EDITMODE-BEGIN*/ {
  friendsFeed: true,
} /*EDITMODE-END*/;

// ---------- App ----------

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState<Route>("home");
  const [matchId, setMatchId] = React.useState<string | null>(null);
  const [picks, setPicks] = React.useState<Pick[]>([]);
  const [balance, setBalance] = React.useState<number>(10000);
  const [showOnboard, setShowOnboard] = React.useState<boolean>(true);
  const [slipOpen, setSlipOpen] = React.useState<boolean>(true);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const labelFor = (k: PickKey, m: Match): string => {
    if (k === "1") return `${(TEAMS as any)[m.home].n} vainqueur`;
    if (k === "2") return `${(TEAMS as any)[m.away].n} vainqueur`;
    if (k === "X") return "Match nul";
    return k;
  };

  const handlePick = (match: Match, k: PickKey, customLabel?: string) => {
    setPicks((prev) => {
      const existing = prev.find((p) => p.matchId === match.id);
      const id = `${match.id}-${k}`;
      // Toggle off si même pick
      if (existing && existing.k === k) {
        return prev.filter((p) => p.matchId !== match.id);
      }
      // Remplace pick existant sur le même match
      const filtered = prev.filter((p) => p.matchId !== match.id);
      return [
        ...filtered,
        {
          id,
          matchId: match.id,
          k,
          game: `${(TEAMS as any)[match.home].sh} vs ${(TEAMS as any)[match.away].sh}`,
          label: customLabel || labelFor(k, match),
          odd: match.odds[k],
        },
      ];
    });
    setSlipOpen(true);
  };

  const isPicked = (mId: string, k: PickKey): boolean =>
    picks.some((p) => p.matchId === mId && p.k === k);

  const removePick = (id: string) =>
    setPicks((prev) => prev.filter((p) => p.id !== id));

  const clearPicks = () => setPicks([]);

  const handlePlace = ({ stake, payout }: PlacePayload) => {
    setBalance((b) => b - stake);
    setPicks([]);
    setToast({
      type: "ok",
      msg: `Pari placé · ${stake.toLocaleString("fr-FR")} K en jeu, ${payout.toLocaleString("fr-FR")} K potentiels`,
    });
    setTimeout(() => setToast(null), 4000);
  };

  const openMatch = (id: string) => {
    setMatchId(id);
    setRoute("match");
    window.scrollTo(0, 0);
  };

  const nav = (r: Route) => {
    setRoute(r);
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <Sidebar active={route === "match" ? "sports" : route} onNav={nav} />
      <div className="main">
        <Topbar balance={balance} onNav={nav} />
        {route === "home" && (
          <HomeScreen
            onPick={handlePick}
            isPicked={isPicked}
            onOpen={openMatch}
            onNav={nav}
            friendsOn={tweaks.friendsFeed}
          />
        )}
        {route === "live" && (
          <LiveScreen onPick={handlePick} isPicked={isPicked} onOpen={openMatch} />
        )}
        {route === "sports" && (
          <SportsScreen onPick={handlePick} isPicked={isPicked} onOpen={openMatch} />
        )}
        {route === "tickets" && <TicketsScreen />}
        {route === "leagues" && <LeaguesScreen />}
        {route === "leaderboard" && <LeaguesScreen />}
        {route === "challenges" && <ChallengesScreen />}
        {route === "profile" && <ProfileScreen />}
        {route === "match" && (
          <MatchDetail
            matchId={matchId}
            onPick={handlePick}
            isPicked={isPicked}
            onBack={() => setRoute("home")}
          />
        )}
      </div>

      {slipOpen && picks.length > 0 && (
        <BetSlip
          picks={picks}
          onRemove={removePick}
          onClear={clearPicks}
          onPlace={handlePlace}
          onClose={() => setSlipOpen(false)}
          balance={balance}
        />
      )}

      {!slipOpen && picks.length > 0 && (
        <button
          onClick={() => setSlipOpen(true)}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            padding: "14px 22px",
            background: "var(--kop)",
            color: "white",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 10px 30px -10px var(--kop)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 100,
          }}
        >
          🎟️ Mon ticket · {picks.length} {picks.length > 1 ? "paris" : "pari"}
        </button>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 24,
            padding: "14px 18px",
            background: "var(--surface-2)",
            border: "1px solid var(--green)",
            borderRadius: 10,
            color: "white",
            fontSize: 13.5,
            fontWeight: 600,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--green)",
              color: "#000",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
            }}
          >
            ✓
          </span>
          {toast.msg}
        </div>
      )}

      {showOnboard && <Onboarding onClose={() => setShowOnboard(false)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection title="Social">
          <TweakToggle
            label="Feed des potes"
            hint="Affiche les paris récents de tes amis sur l'accueil"
            value={tweaks.friendsFeed}
            onChange={(v: boolean) => setTweak("friendsFeed", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
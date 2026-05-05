"use client";

import React from "react";
import { Icon } from "@/components/kop/ui";

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

interface TopbarProps {
  balance: number;
  onNav: (route: Route) => void;
}

// ---------- Component ----------

export function Topbar({ balance, onNav }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="search">
        <Icon name="search" size={16} stroke={1.8} />
        <input placeholder="Rechercher un match, un joueur, une ligue…" />
        <span className="kbd">⌘K</span>
      </div>

      <div style={{ flex: 1 }} />

      <div className="balance">
        <div className="k-coin">K</div>
        <div>
          <div className="amount tnum">{balance.toLocaleString("fr-FR")}</div>
          <div className="label">Solde Kops</div>
        </div>
        <button className="btn btn-sm btn-primary" style={{ marginLeft: 8 }}>
          + Recharger
        </button>
      </div>

      <button className="topbar-btn" title="Notifications">
        <Icon name="bell" size={18} stroke={1.8} />
      </button>
      <button className="topbar-btn" title="Réglages">
        <Icon name="settings" size={18} stroke={1.6} />
      </button>

      <div
        className="avatar"
        onClick={() => onNav("profile")}
        style={{ cursor: "pointer" }}
      >
        YO
      </div>
    </div>
  );
}
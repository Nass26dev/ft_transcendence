"use client";

import React from "react";
import { Icon, Kops } from "@/components/kop/ui";

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

interface NavItem {
  id: Route;
  label: string;
  icon: string;
  badge?: string;
  badgeMuted?: string;
}

interface SidebarProps {
  active: Route;
  onNav: (route: Route) => void;
}

// ---------- Component ----------

export function Sidebar({ active, onNav }: SidebarProps) {
  const items: NavItem[] = [
    { id: "home", label: "Accueil", icon: "home" },
    { id: "live", label: "En direct", icon: "live", badge: "4" },
    { id: "sports", label: "Tous les matchs", icon: "sports" },
  ];

  const social: NavItem[] = [
    { id: "tickets", label: "Mes paris", icon: "ticket", badge: "1" },
    { id: "leagues", label: "Ligues", icon: "league" },
    { id: "leaderboard", label: "Classement", icon: "trophy" },
    { id: "challenges", label: "Défis", icon: "flame", badgeMuted: "3" },
  ];

  const me: NavItem[] = [{ id: "profile", label: "Profil", icon: "user" }];

  const Item = ({ it }: { it: NavItem }) => (
    <div
      className={`nav-item ${active === it.id ? "active" : ""}`}
      onClick={() => onNav(it.id)}
    >
      <Icon name={it.icon} size={18} stroke={1.8} />
      <span>{it.label}</span>
      {it.badge && <span className="badge">{it.badge}</span>}
      {it.badgeMuted && <span className="badge muted">{it.badgeMuted}</span>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/assets/logo.png" alt="Kop" />
        <span className="logotype">Kop</span>
      </div>

      <div className="nav-section">
        {items.map((it) => (
          <Item key={it.id} it={it} />
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-section-title">Social</div>
        {social.map((it) => (
          <Item key={it.id} it={it} />
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-section-title">Compte</div>
        {me.map((it) => (
          <Item key={it.id} it={it} />
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: 12,
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Bonus quotidien
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Kops amount={500} size={15} color="var(--green)" />
        </div>
        <button className="btn btn-primary btn-sm" style={{ width: "100%" }}>
          Récupérer
        </button>
      </div>
    </aside>
  );
}
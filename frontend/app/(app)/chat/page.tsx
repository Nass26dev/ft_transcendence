"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../_components/ProfileProvider";
import { useConversations } from "@/hooks/useConversations";
import { useLeagues } from "@/hooks/useLeagues";
import { searchUsers, type SearchUser } from "@/hooks/useFriends";
import { ChatWindow, type ActiveRoom } from "@/components/chat/ChatWindow";
import type { Conversation } from "@/utils/chat";

type Tab = "dm" | "league";

// ---------- Sous-composants ----------

function Avatar({ label, league }: { label: string; league?: boolean }) {
  return (
    <div
      className={[
        "grid h-9 w-9 flex-none place-items-center rounded-full text-[12.5px] font-bold text-white",
        league
          ? "bg-gradient-to-br from-[#3A86FF] to-[#1D3F6B]"
          : "bg-gradient-to-br from-[#FF6B6B] to-[#C9184A]",
      ].join(" ")}
    >
      {league ? <Icon name="league" size={17} stroke={1.8} /> : label.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ListRow({
  active,
  onClick,
  label,
  sub,
  league,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  league?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors",
        active ? "bg-surface-2" : "hover:bg-surface-1",
      ].join(" ")}
    >
      <Avatar label={label} league={league} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{label}</div>
        {sub && <div className="truncate text-[11.5px] text-text-3">{sub}</div>}
      </div>
    </button>
  );
}

// ---------- Page ----------

export default function ChatPage() {
  const { profile, isAuthenticated, ready } = useProfile();
  const { conversations, openConversation } = useConversations();
  const { myLeagues } = useLeagues();

  const [tab, setTab] = React.useState<Tab>("dm");
  const [active, setActive] = React.useState<ActiveRoom | null>(null);

  // Recherche pour démarrer une nouvelle conversation.
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchUser[]>([]);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setResults(await searchUsers(q));
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const openDm = async (user: { id: number; username: string }) => {
    try {
      const conv = await openConversation(user.id);
      setActive({ kind: "dm", id: conv.id, title: conv.peer.username });
      setQuery("");
      setResults([]);
    } catch (err) {
      console.error("Impossible d'ouvrir la conversation:", err);
    }
  };

  const selectConversation = (c: Conversation) =>
    setActive({ kind: "dm", id: c.id, title: c.peer.username });

  const selectLeague = (l: { id: number; name: string; members_count: number }) =>
    setActive({
      kind: "league",
      id: l.id,
      title: l.name,
      subtitle: `${l.members_count} membre${l.members_count > 1 ? "s" : ""}`,
    });

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">Messages</h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">Connecte-toi pour accéder au chat.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-[10px] bg-kop px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-kop-bright"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0">
      {/* ── Colonne gauche : listes ─────────────────────────────────── */}
      <div
        className={[
          "w-full flex-none flex-col border-r border-border lg:flex lg:w-[300px]",
          active ? "hidden lg:flex" : "flex",
        ].join(" ")}
      >
        {/* Onglets */}
        <div className="flex gap-1 border-b border-border p-2">
          {(["dm", "league"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "flex-1 rounded-[8px] px-3 py-2 text-[13px] font-semibold transition-colors",
                tab === t ? "bg-surface-2 text-text" : "text-text-2 hover:bg-surface-1",
              ].join(" ")}
            >
              {t === "dm" ? "Messages" : "Ligues"}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {tab === "dm" ? (
            <>
              {/* Recherche nouvelle conversation */}
              <div className="mb-2 flex items-center gap-2 rounded-[10px] border border-border bg-surface-2 px-3 py-2">
                <Icon name="search" size={15} stroke={1.8} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nouveau message…"
                  className="flex-1 border-none bg-transparent text-[13px] outline-none placeholder:text-text-3"
                />
              </div>

              {results.length > 0 && (
                <div className="mb-2 border-b border-border pb-2">
                  {results.map((u) => (
                    <ListRow
                      key={u.id}
                      active={false}
                      onClick={() => openDm(u)}
                      label={u.username}
                      sub={u.email}
                    />
                  ))}
                </div>
              )}

              {conversations.length === 0 && results.length === 0 ? (
                <div className="px-2 py-6 text-center text-[12.5px] text-text-3">
                  Aucune conversation. Cherche un joueur pour commencer.
                </div>
              ) : (
                conversations.map((c) => (
                  <ListRow
                    key={c.id}
                    active={active?.kind === "dm" && active.id === c.id}
                    onClick={() => selectConversation(c)}
                    label={c.peer.username}
                    sub={c.last_message ?? "Démarrer la discussion"}
                  />
                ))
              )}
            </>
          ) : myLeagues.length === 0 ? (
            <div className="px-2 py-6 text-center text-[12.5px] text-text-3">
              Tu n&apos;es membre d&apos;aucune ligue.{" "}
              <Link href="/leagues" className="text-kop hover:underline">
                Rejoins-en une
              </Link>
              .
            </div>
          ) : (
            myLeagues.map((l) => (
              <ListRow
                key={l.id}
                active={active?.kind === "league" && active.id === l.id}
                onClick={() => selectLeague(l)}
                label={l.name}
                sub={`${l.members_count} membre${l.members_count > 1 ? "s" : ""}`}
                league
              />
            ))
          )}
        </div>
      </div>

      {/* ── Colonne droite : fenêtre de chat ───────────────────────── */}
      <div className={["min-w-0 flex-1", active ? "block" : "hidden lg:block"].join(" ")}>
        {active && profile ? (
          <ChatWindow
            key={`${active.kind}-${active.id}`}
            room={active}
            currentUserId={profile.id}
            onBack={() => setActive(null)}
          />
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-surface-2">
                <Icon name="chat" size={26} stroke={1.6} />
              </div>
              <p className="text-[14px] font-semibold">Tes conversations</p>
              <p className="mt-1 text-[13px] text-text-3">
                Sélectionne un message ou une ligue pour discuter.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

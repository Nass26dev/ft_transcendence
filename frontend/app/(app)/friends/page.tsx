"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../_components/ProfileProvider";
import {
  useFriends,
  searchUsers,
  type FriendUser,
  type SearchUser,
} from "@/hooks/useFriends";
import { userInitials } from "@/utils/user";
import { Avatar } from "@/components/ui/Avatar";

/** Ligne d'un joueur (ami, demande ou résultat de recherche) avec une action contextuelle. */
function PlayerRow({
  user,
  action,
}: {
  user: FriendUser;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Avatar
        src={user.avatar}
        initials={userInitials(user)}
        className="h-10 w-10 text-[13px]"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">{user.username || user.email}</div>
        <div className="truncate text-[12px] text-text-3">{user.email}</div>
      </div>
      <div className="flex-none">{action}</div>
    </div>
  );
}

/** Bloc de section avec titre et compteur optionnel (ex : nombre d'amis). */
function Card({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold tracking-[-0.01em]">
        {title}
        {count !== undefined && count > 0 && (
          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-text-2">
            {count}
          </span>
        )}
      </h2>
      {children}
    </div>
  );
}

const btnPrimary =
  "rounded-[8px] bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-[8px] border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50";

/** Page Amis : recherche de joueurs, demandes reçues/envoyées et liste d'amis. */
export default function FriendsPage() {
  const { isAuthenticated, ready } = useProfile();
  const { friends, incoming, outgoing, sendRequest, accept, decline, removeFriend } = useFriends();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchUser[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [busy, setBusy] = React.useState<number | null>(null);

  /** Pré-remplit la recherche depuis ?q= (recherche lancée depuis la top bar). */
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  /** Recherche débouncée (300 ms) à chaque changement de requête. */
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        setResults(await searchUsers(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  /** Relance la recherche courante (après une action) pour rafraîchir les statuts affichés. */
  const refreshSearch = async () => {
    const q = query.trim();
    if (q.length >= 2) {
      try {
        setResults(await searchUsers(q));
      } catch {
      }
    }
  };

  const run = async (id: number, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      await refreshSearch();
    } catch (err) {
      console.error("Action amis échouée:", err);
    } finally {
      setBusy(null);
    }
  };

  if (ready && !isAuthenticated) {
    return (
      <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-[28px] font-bold tracking-[-0.02em]">Amis</h1>
        <div className="mt-6 rounded-[10px] border border-border bg-surface-1 p-8 text-center">
          <p className="text-[14px] text-text-2">Connecte-toi pour gérer tes amis.</p>
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

  function searchAction(u: SearchUser): React.ReactNode {
    if (u.status === "friends")
      return <span className="text-[12.5px] font-semibold text-green">Amis ✓</span>;
    if (u.status === "pending_sent")
      return <span className="text-[12.5px] font-medium text-text-3">Demande envoyée</span>;
    if (u.status === "pending_received")
      return (
        <button
          className={btnPrimary}
          disabled={busy === u.id}
          onClick={() => u.friendship_id && run(u.id, () => accept(u.friendship_id!))}
        >
          Accepter
        </button>
      );
    return (
      <button className={btnPrimary} disabled={busy === u.id} onClick={() => run(u.id, () => sendRequest(u.id))}>
        Ajouter
      </button>
    );
  }

  return (
    <div className="max-w-[760px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">Amis</h1>
      <p className="mt-1 text-[13.5px] text-text-3">Recherche des joueurs et défie tes potes.</p>

      <div className="mt-6 flex flex-col gap-4">
        <Card title="Trouver des joueurs">
          <div className="mb-1 flex items-center gap-2.5 rounded-[10px] border border-border bg-surface-2 px-3 py-2.5">
            <Icon name="search" size={16} stroke={1.8} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par pseudo ou email…"
              className="flex-1 border-none bg-transparent text-[13.5px] outline-none placeholder:text-text-3"
            />
          </div>

          <div className="mt-1">
            {query.trim().length >= 2 && searching && (
              <div className="py-3 text-[13px] text-text-3">Recherche…</div>
            )}
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="py-3 text-[13px] text-text-3">Aucun joueur trouvé.</div>
            )}
            {results.map((u) => (
              <PlayerRow key={u.id} user={u} action={searchAction(u)} />
            ))}
          </div>
        </Card>

        {incoming.length > 0 && (
          <Card title="Demandes reçues" count={incoming.length}>
            {incoming.map((f) => (
              <PlayerRow
                key={f.friendship_id}
                user={f.user}
                action={
                  <div className="flex gap-2">
                    <button
                      className={btnPrimary}
                      disabled={busy === f.user.id}
                      onClick={() => run(f.user.id, () => accept(f.friendship_id))}
                    >
                      Accepter
                    </button>
                    <button
                      className={btnGhost}
                      disabled={busy === f.user.id}
                      onClick={() => run(f.user.id, () => decline(f.friendship_id))}
                    >
                      Refuser
                    </button>
                  </div>
                }
              />
            ))}
          </Card>
        )}

        {outgoing.length > 0 && (
          <Card title="Demandes envoyées" count={outgoing.length}>
            {outgoing.map((f) => (
              <PlayerRow
                key={f.friendship_id}
                user={f.user}
                action={<span className="text-[12.5px] font-medium text-text-3">En attente</span>}
              />
            ))}
          </Card>
        )}

        <Card title="Mes amis" count={friends.length}>
          {friends.length === 0 ? (
            <div className="py-3 text-[13px] text-text-3">
              Pas encore d&apos;amis. Cherche des joueurs ci-dessus pour commencer.
            </div>
          ) : (
            friends.map((f) => (
              <PlayerRow
                key={f.friendship_id}
                user={f.user}
                action={
                  <button
                    className={btnGhost}
                    disabled={busy === f.user.id}
                    onClick={() => run(f.user.id, () => removeFriend(f.friendship_id))}
                  >
                    Retirer
                  </button>
                }
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

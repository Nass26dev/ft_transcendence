"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useProfile } from "../../_components/ProfileProvider";
import api from "@/utils/api";
import { num, fmt, initialsOf, errMessage } from "./_components/helpers";
import { Card, InfoRow, StatusBadge, StatCard } from "./_components/primitives";
import { WalletEditor } from "./_components/WalletEditor";
import { DataEditor } from "./_components/DataEditor";
import { AccountDeleter } from "./_components/AccountDeleter";
import { FriendsManager } from "./_components/FriendsManager";
import { BetsViewer } from "./_components/BetsViewer";
import type { UserListItem, UserDetail, Stats } from "./_components/types";

type Tab = "data" | "wallet" | "friends" | "bets" | "danger";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "data", label: "Données", icon: "user" },
  { id: "wallet", label: "Wallet", icon: "wallet" },
  { id: "friends", label: "Amis", icon: "users" },
  { id: "bets", label: "Paris", icon: "trending-up" },
  { id: "danger", label: "Compte", icon: "shield" },
];

/** Panneau d'administration (owner/admin) : recherche, dashboard global et gestion complète d'un utilisateur. */
export default function AdminPage() {
  const { profile, isAuthenticated, ready } = useProfile();
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [users, setUsers] = React.useState<UserListItem[]>([]);
  const [selected, setSelected] = React.useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("data");
  const [error, setError] = React.useState("");
  const [stats, setStats] = React.useState<Stats | null>(null);

  const isOwner = profile?.status === "owner";
  const canAccess = profile?.status === "admin" || profile?.status === "owner";

  /** Redirige les non-admins : vers /login si déconnecté, vers /settings si sans droits admin. */
  React.useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!canAccess) router.replace("/settings");
  }, [ready, isAuthenticated, canAccess, router]);

  const loadUsers = React.useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<UserListItem[]>("/api/admin/users/", {
        params: q ? { q } : undefined,
      });
      setUsers(data.map((u) => ({ ...u, wallet: num(u.wallet) })));
      if (data.length === 0) setError("Aucun utilisateur trouvé.");
    } catch (e) {
      setError(errMessage(e, "Erreur lors du chargement."));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Chargement initial du panneau admin : statistiques globales + liste complète des utilisateurs. */
  React.useEffect(() => {
    if (!ready || !canAccess) return;
    loadUsers("");
    api
      .get<Stats>("/api/admin/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null));
  }, [ready, canAccess, loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelected(null);
    loadUsers(query.trim());
  };

  const openUser = async (id: number) => {
    setLoadingDetail(true);
    setError("");
    try {
      const { data } = await api.get<UserDetail>(`/api/admin/users/${id}/`);
      setSelected({
        ...data,
        wallet: num(data.wallet),
        bets: data.bets.map((b) => ({
          ...b,
          stake: num(b.stake),
          odd_value: num(b.odd_value),
          potential_win: num(b.potential_win),
        })),
      });
      setTab("data");
    } catch (e) {
      setError(errMessage(e, "Impossible de charger cet utilisateur."));
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!ready) return null;
  if (!canAccess) return null;

  return (
    <div className="max-w-[820px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      <div className="mb-1 flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-[8px] bg-kop/15">
          <Icon name="shield" size={16} stroke={2} className="text-kop-bright" />
        </div>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">
          Administration
        </h1>
      </div>
      <p className="mb-6 text-[13.5px] text-text-3">
        Vue d&apos;ensemble et gestion des utilisateurs (données, solde, amis, paris).
      </p>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon="users"
            label="Utilisateurs"
            value={fmt(stats.total_users)}
            hint={`${stats.owners} owner · ${stats.admins} admin`}
          />
          <StatCard
            icon="wallet"
            label="Kops totaux"
            value={fmt(stats.total_wallet)}
            hint="en circulation"
          />
          <StatCard
            icon="trending-up"
            label="Paris"
            value={fmt(stats.total_bets)}
            hint={`${stats.pending_bets} en cours`}
          />
          <StatCard icon="trophy" label="Paris gagnés" value={fmt(stats.won_bets)} />
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par pseudo ou email…"
          className="flex-1 rounded-[10px] border border-border bg-surface-1 px-4 py-2.5 text-[14px] text-text placeholder:text-text-3 outline-none transition-colors focus:border-kop"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-[10px] bg-kop px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
        >
          <Icon name="search" size={15} stroke={2.5} />
          {loading ? "…" : "Chercher"}
        </button>
      </form>

      {error && !selected && <p className="mt-2 text-[13px] text-text-3">{error}</p>}

      {!selected && users.length > 0 && (
        <div className="mt-3 flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface-1">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => openUser(u.id)}
              disabled={loadingDetail}
              className="flex items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2 disabled:opacity-60"
            >
              <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[13px] font-bold text-white">
                {initialsOf(u.username)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-text">{u.username}</span>
                  <StatusBadge status={u.status} />
                </div>
                <div className="truncate text-[12px] text-text-3">{u.email}</div>
              </div>
              <div className="flex-none text-[12.5px] text-text-3">{fmt(u.wallet)} Kops</div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-[10px] border border-border bg-surface-1 p-5">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[16px] font-bold text-white">
              {initialsOf(selected.username)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[17px] font-bold text-text">
                  {selected.username}
                </span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="text-[12.5px] text-text-3">{selected.email}</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="flex-none rounded-[8px] border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:bg-surface-3"
            >
              ← Retour
            </button>
          </div>

          <div className="flex gap-1 rounded-[10px] border border-border bg-surface-1 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-semibold transition-colors",
                  tab === t.id
                    ? "bg-kop text-white"
                    : "text-text-3 hover:bg-surface-2 hover:text-text",
                ].join(" ")}
              >
                <Icon name={t.icon} size={13} stroke={2} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "data" && (
            <Card title="Données utilisateur" icon="user">
              <div className="mb-4">
                <InfoRow
                  label="Onboarding"
                  value={selected.onboarding_completed ? "Complété" : "En cours"}
                />
                <InfoRow
                  label="Dernier bonus quotidien"
                  value={
                    selected.last_daily_bonus
                      ? new Date(selected.last_daily_bonus).toLocaleDateString("fr-FR")
                      : "Jamais"
                  }
                />
              </div>
              <DataEditor
                userId={selected.id}
                user={selected}
                canEditOwner={!!isOwner}
                onSaved={(updated) =>
                  setSelected((prev) => (prev ? { ...prev, ...updated } : prev))
                }
              />
            </Card>
          )}

          {tab === "wallet" && (
            <Card title="Solde Kops" icon="wallet">
              <p className="mb-4 text-[13px] text-text-3">
                Solde actuel :{" "}
                <span className="font-semibold text-text">{fmt(selected.wallet)} Kops</span>
              </p>
              <WalletEditor
                userId={selected.id}
                current={selected.wallet}
                onSaved={(v) =>
                  setSelected((prev) => (prev ? { ...prev, wallet: v } : prev))
                }
              />
            </Card>
          )}

          {tab === "friends" && (
            <Card title={`Amis (${selected.friends.length})`} icon="users">
              <FriendsManager
                userId={selected.id}
                friends={selected.friends}
                onUpdated={(friends) =>
                  setSelected((prev) => (prev ? { ...prev, friends } : prev))
                }
              />
            </Card>
          )}

          {tab === "bets" && (
            <Card title={`Paris (${selected.bets.length})`} icon="trending-up">
              <BetsViewer bets={selected.bets} />
            </Card>
          )}

          {tab === "danger" && (
            <Card title="Supprimer le compte" icon="shield">
              <AccountDeleter
                user={selected}
                isOwner={!!isOwner}
                currentUserId={profile?.id ?? 0}
                onDeleted={() => {
                  setSelected(null);
                  loadUsers(query.trim());
                }}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

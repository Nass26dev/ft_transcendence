"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useProfile } from "../../_components/ProfileProvider";
import api from "@/utils/api";

type Role = "owner" | "admin" | "user";

interface UserListItem {
  id: number;
  username: string;
  email: string;
  status: Role;
  wallet: number;
}

interface Friend {
  id: number;
  username: string;
  email: string;
}

interface BetSelection {
  id: number;
  match: string;
  odd: string;
  odd_value: number;
  status: string;
}

interface Bet {
  id: number;
  stake: number;
  odd_value: number;
  status: string;
  created_at: string;
  settled_at: string | null;
  potential_win: number;
  selections: BetSelection[];
}

interface UserDetail extends UserListItem {
  bio: string;
  onboarding_completed: boolean;
  last_daily_bonus: string | null;
  friends: Friend[];
  bets: Bet[];
}

interface Stats {
  total_users: number;
  owners: number;
  admins: number;
  users: number;
  total_wallet: number;
  total_bets: number;
  pending_bets: number;
  won_bets: number;
}

/** Coerce en nombre : DRF sérialise les DecimalField en chaînes (ex. "100.00"). */
const num = (v: unknown) => Number(v ?? 0);
/** Formate un montant (Decimal ou number) en nombre localisé fr-FR. */
const fmt = (v: unknown) => num(v).toLocaleString("fr-FR");
/** Initiales (2 lettres majuscules) affichées dans les avatars de la liste admin. */
const initialsOf = (name: string) => name.slice(0, 2).toUpperCase();

/** Message d'erreur lisible à partir d'une erreur axios. */
function errMessage(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const first = Object.values(data as Record<string, unknown>)[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return fallback;
}

/** Bloc de section avec titre et icône optionnelle, utilisé dans tout le panneau admin. */
function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconName;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold tracking-[-0.01em]">
        {icon && <Icon name={icon} size={15} stroke={2} className="text-kop-bright" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Ligne d'information en lecture seule (libellé + valeur). */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-[13px] text-text-3">{label}</span>
      <span className="text-[13.5px] font-medium text-text">{value}</span>
    </div>
  );
}

/** Badge coloré affichant le rôle d'un utilisateur (owner / admin / user). */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    owner: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    admin: "bg-kop/15 text-kop-bright border-kop/30",
    user: "bg-surface-3 text-text-3 border-border",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${colors[status] ?? colors.user}`}
    >
      {status}
    </span>
  );
}

/** Tuile de statistique globale (icône, libellé, valeur, indication secondaire). */
function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2 text-text-3">
        <Icon name={icon} size={14} stroke={2} />
        <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="font-display text-[22px] font-bold tracking-[-0.01em] text-text">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[12px] text-text-3">{hint}</div>}
    </div>
  );
}

/** Éditeur de solde Kops d'un utilisateur, avec validation (nombre positif) et sauvegarde. */
function WalletEditor({
  userId,
  current,
  onSaved,
}: {
  userId: number;
  current: number;
  onSaved: (v: number) => void;
}) {
  const [val, setVal] = React.useState(String(current));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSave = async () => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      setError("Valeur invalide.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(`/api/admin/users/${userId}/wallet/`, {
        wallet: parsed,
      });
      onSaved(num(data.wallet));
    } catch (e) {
      setError(errMessage(e, "Erreur lors de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={0.01}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop sm:w-40"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[8px] bg-kop px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  );
}

/** Éditeur des données d'un utilisateur (pseudo, email, bio, rôle) ; le rôle n'est modifiable que par un owner. */
function DataEditor({
  userId,
  user,
  canEditOwner,
  onSaved,
}: {
  userId: number;
  user: UserDetail;
  canEditOwner: boolean;
  onSaved: (u: Partial<UserDetail>) => void;
}) {
  const [username, setUsername] = React.useState(user.username);
  const [email, setEmail] = React.useState(user.email);
  const [bio, setBio] = React.useState(user.bio);
  const [status, setStatus] = React.useState<Role>(user.status);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.patch(`/api/admin/users/${userId}/`, {
        username,
        email,
        bio,
        status,
      });
      onSaved({ username, email, bio, status });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(errMessage(e, "Erreur lors de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-text-3">Nom d&apos;utilisateur</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-text-3">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] text-text-3">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="resize-none rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] text-text-3">Statut</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Role)}
          disabled={!canEditOwner}
          className="w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop disabled:opacity-50 sm:w-40"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
        </select>
        {!canEditOwner && (
          <span className="text-[11px] text-text-3">
            Seul un owner peut changer les rôles.
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[8px] bg-kop px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {success && <span className="text-[12px] text-green-400">✓ Enregistré</span>}
        {error && <span className="text-[12px] text-red-400">{error}</span>}
      </div>
    </div>
  );
}

/** Liste des amis d'un utilisateur avec possibilité de retirer une relation d'amitié. */
function FriendsManager({
  userId,
  friends,
  onUpdated,
}: {
  userId: number;
  friends: Friend[];
  onUpdated: (friends: Friend[]) => void;
}) {
  const [removing, setRemoving] = React.useState<number | null>(null);

  const handleRemove = async (friendId: number) => {
    setRemoving(friendId);
    try {
      await api.delete(`/api/admin/users/${userId}/friends/${friendId}/`);
      onUpdated(friends.filter((f) => f.id !== friendId));
    } finally {
      setRemoving(null);
    }
  };

  if (friends.length === 0) {
    return <p className="text-[13px] text-text-3">Aucun ami.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {friends.map((f) => (
        <div key={f.id} className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13.5px] font-medium text-text">{f.username}</div>
            <div className="text-[12px] text-text-3">{f.email}</div>
          </div>
          <button
            onClick={() => handleRemove(f.id)}
            disabled={removing === f.id}
            className="rounded-[8px] border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
          >
            {removing === f.id ? "…" : "Retirer"}
          </button>
        </div>
      ))}
    </div>
  );
}

/** Historique en lecture seule des paris d'un utilisateur, avec statut coloré. */
function BetsViewer({ bets }: { bets: Bet[] }) {
  const statusColors: Record<string, string> = {
    won: "text-green-400",
    lost: "text-red-400",
    pending: "text-amber-400",
    cancelled: "text-text-3",
  };

  if (bets.length === 0) {
    return <p className="text-[13px] text-text-3">Aucun pari.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {bets.map((b) => {
        const label =
          b.selections.length > 0
            ? b.selections.map((s) => s.match).join(" · ")
            : "Pari";
        return (
          <div key={b.id} className="flex items-start justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium text-text">{label}</div>
              <div className="text-[12px] text-text-3">
                {new Date(b.created_at).toLocaleDateString("fr-FR")} ·{" "}
                {b.selections.length} sélection{b.selections.length > 1 ? "s" : ""} · cote{" "}
                {num(b.odd_value).toFixed(2)}
              </div>
            </div>
            <div className="flex flex-none flex-col items-end">
              <span className="text-[13px] font-semibold text-text">{fmt(b.stake)} Kops</span>
              <span
                className={`text-[12px] font-medium capitalize ${statusColors[b.status] ?? "text-text-3"}`}
              >
                {b.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Tab = "data" | "wallet" | "friends" | "bets";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "data", label: "Données", icon: "user" },
  { id: "wallet", label: "Wallet", icon: "wallet" },
  { id: "friends", label: "Amis", icon: "users" },
  { id: "bets", label: "Paris", icon: "trending-up" },
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
        </div>
      )}
    </div>
  );
}

"use client";
// test
import React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../../_components/ProfileProvider";
import { userInitials } from "@/utils/user";

// ---------- Types ----------

type UserResult = {
  id: number;
  username: string;
  email: string;
  status: "admin" | "owner" | "user";
  wallet: number;
  bio: string;
  onboarding_completed: boolean;
  last_daily_bonus: string | null;
  friends: Friend[];
  bets: Bet[];
};

type Friend = {
  id: number;
  username: string;
  email: string;
};

type Bet = {
  id: number;
  label: string;
  amount: number;
  status: string;
  created_at: string;
};

// ---------- Sub-components ----------

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-[13px] text-text-3">{label}</span>
      <span className="text-[13.5px] font-medium text-text">{value}</span>
    </div>
  );
}

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

// ---------- Editable wallet ----------

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
      const res = await fetch(`/api/admin/users/${userId}/wallet/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: parsed }),
      });
      if (!res.ok) throw new Error();
      onSaved(parsed);
    } catch {
      setError("Erreur lors de la sauvegarde.");
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
          className="w-40 rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[8px] bg-kop px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
        >
          {saving ? "…" : "Sauvegarder"}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  );
}

// ---------- Editable data ----------

function DataEditor({
  userId,
  user,
  onSaved,
}: {
  userId: number;
  user: UserResult;
  onSaved: (u: Partial<UserResult>) => void;
}) {
  const [username, setUsername] = React.useState(user.username);
  const [email, setEmail] = React.useState(user.email);
  const [bio, setBio] = React.useState(user.bio);
  const [status, setStatus] = React.useState(user.status);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, bio, status }),
      });
      if (!res.ok) throw new Error();
      onSaved({ username, email, bio, status });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] text-text-3">Nom d'utilisateur</label>
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
          onChange={(e) => setStatus(e.target.value as UserResult["status"])}
          className="w-40 rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-kop"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
        </select>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[8px] bg-kop px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        {success && (
          <span className="text-[12px] text-green-400">✓ Sauvegardé</span>
        )}
        {error && <span className="text-[12px] text-red-400">{error}</span>}
      </div>
    </div>
  );
}

// ---------- Friends manager ----------

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
      await fetch(`/api/admin/users/${userId}/friends/${friendId}/`, {
        method: "DELETE",
      });
      onUpdated(friends.filter((f) => f.id !== friendId));
    } finally {
      setRemoving(null);
    }
  };

  if (friends.length === 0) {
    return (
      <p className="text-[13px] text-text-3">Aucun ami.</p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {friends.map((f) => (
        <div key={f.id} className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13.5px] font-medium text-text">
              {f.username}
            </div>
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

// ---------- Bets viewer ----------

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
      {bets.map((b) => (
        <div key={b.id} className="flex items-center justify-between py-2.5">
          <div className="min-w-0 pr-4">
            <div className="truncate text-[13.5px] font-medium text-text">
              {b.label}
            </div>
            <div className="text-[12px] text-text-3">
              {new Date(b.created_at).toLocaleDateString("fr-FR")}
            </div>
          </div>
          <div className="flex flex-none items-center gap-3">
            <span className="text-[13px] font-semibold text-text">
              {b.amount.toLocaleString("fr-FR")} Kops
            </span>
            <span
              className={`text-[12px] font-medium capitalize ${statusColors[b.status] ?? "text-text-3"}`}
            >
              {b.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Page ----------

type Tab = "data" | "wallet" | "friends" | "bets";

export default function AdminPage() {
  const { profile, isAuthenticated, ready } = useProfile();
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<UserResult[]>([]);
  const [selected, setSelected] = React.useState<UserResult | null>(null);
  const [tab, setTab] = React.useState<Tab>("data");
  const [searchError, setSearchError] = React.useState("");

  // Redirect non-admins
  React.useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const canAccess =
      profile?.status === "admin" || profile?.status === "owner";
    if (!canAccess) router.replace("/settings");
  }, [ready, isAuthenticated, profile, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    setSelected(null);
    try {
      const res = await fetch(
        `/api/admin/users/?q=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) throw new Error();
      const data: UserResult[] = await res.json();
      setResults(data);
      if (data.length === 0) setSearchError("Aucun utilisateur trouvé.");
    } catch {
      setSearchError("Erreur lors de la recherche.");
    } finally {
      setSearching(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "data", label: "Données", icon: "user" },
    { id: "wallet", label: "Wallet", icon: "wallet" },
    { id: "friends", label: "Amis", icon: "users" },
    { id: "bets", label: "Paris", icon: "trending-up" },
  ];

  if (!ready) return null;

  const canAccess =
    profile?.status === "admin" || profile?.status === "owner";
  if (!canAccess) return null;

  const initials = selected
    ? selected.username.slice(0, 2).toUpperCase()
    : null;

  return (
    <div className="max-w-[820px] px-4 pb-15 pt-7 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-1 flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-[8px] bg-kop/15">
          <Icon name="shield" size={16} stroke={2} className="text-kop-bright" />
        </div>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">
          Administration
        </h1>
      </div>
      <p className="mb-6 text-[13.5px] text-text-3">
        Recherche un utilisateur pour modifier ses données, wallet, amis ou
        paris.
      </p>

      {/* Search */}
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
          disabled={searching}
          className="flex items-center gap-2 rounded-[10px] bg-kop px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
        >
          <Icon name="search" size={15} stroke={2.5} />
          {searching ? "…" : "Chercher"}
        </button>
      </form>

      {searchError && (
        <p className="mt-2 text-[13px] text-text-3">{searchError}</p>
      )}

      {/* Results list */}
      {results.length > 0 && !selected && (
        <div className="mt-3 flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface-1">
          {results.map((u, i) => (
            <button
              key={u.id}
              onClick={() => {
                setSelected(u);
                setResults([]);
                setTab("data");
              }}
              className="flex items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[13px] font-bold text-white">
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-text">
                    {u.username}
                  </span>
                  <StatusBadge status={u.status} />
                </div>
                <div className="truncate text-[12px] text-text-3">
                  {u.email}
                </div>
              </div>
              <div className="flex-none text-[12.5px] text-text-3">
                {u.wallet.toLocaleString("fr-FR")} Kops
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected user panel */}
      {selected && (
        <div className="mt-4 flex flex-col gap-4">
          {/* User header */}
          <div className="flex items-center gap-4 rounded-[10px] border border-border bg-surface-1 p-5">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-[16px] font-bold text-white">
              {initials}
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
              className="flex-none rounded-[8px] border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-text-3 transition-colors hover:border-border-strong hover:bg-surface-3"
            >
              ← Nouvelle recherche
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-[10px] border border-border bg-surface-1 p-1">
            {tabs.map((t) => (
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

          {/* Tab content */}
          {tab === "data" && (
            <Card title="Données utilisateur" icon="user">
              <div className="mb-4">
                <InfoRow
                  label="Onboarding"
                  value={
                    selected.onboarding_completed ? "Complété" : "En cours"
                  }
                />
                <InfoRow
                  label="Dernier bonus quotidien"
                  value={
                    selected.last_daily_bonus
                      ? new Date(selected.last_daily_bonus).toLocaleDateString(
                          "fr-FR",
                        )
                      : "Jamais"
                  }
                />
              </div>
              <DataEditor
                userId={selected.id}
                user={selected}
                onSaved={(updated) =>
                  setSelected((prev) =>
                    prev ? { ...prev, ...updated } : prev,
                  )
                }
              />
            </Card>
          )}

          {tab === "wallet" && (
            <Card title="Solde Kops" icon="wallet">
              <p className="mb-4 text-[13px] text-text-3">
                Solde actuel :{" "}
                <span className="font-semibold text-text">
                  {selected.wallet.toLocaleString("fr-FR")} Kops
                </span>
              </p>
              <WalletEditor
                userId={selected.id}
                current={selected.wallet}
                onSaved={(v) =>
                  setSelected((prev) =>
                    prev ? { ...prev, wallet: v } : prev,
                  )
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
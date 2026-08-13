import React from "react";
import api from "@/utils/api";
import { errMessage } from "./helpers";
import type { Role, UserDetail } from "./types";

/** Éditeur des données d'un utilisateur (pseudo, email, bio, rôle) ; le rôle n'est modifiable que par un owner. */
export function DataEditor({
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

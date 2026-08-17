"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import type { ApiLeague } from "@/utils/types";

/** Modale d'édition d'une ligue : renommer, redécrire, ou supprimer.
 *
 *  La suppression demande une confirmation dans la même modale plutôt qu'un
 *  `confirm()` natif : l'action est irréversible et emporte les messages du
 *  chat de la ligue. */
export function EditLeagueModal({
  league,
  onClose,
  onUpdate,
  onDelete,
}: {
  league: ApiLeague;
  onClose: () => void;
  onUpdate: (id: number, name: string, description: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [name, setName] = React.useState(league.name);
  const [description, setDescription] = React.useState(league.description ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom ne peut pas être vide.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(league.id, name.trim(), description.trim());
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const detail =
        (data?.error as string) ??
        (Array.isArray(data?.name) ? (data.name as string[])[0] : null) ??
        "Impossible de modifier la ligue.";
      setError(detail);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      await onDelete(league.id);
      onClose();
    } catch {
      setError("Impossible de supprimer la ligue.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      className="w-full max-w-[420px] rounded-[14px] border border-border bg-surface-1 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Modifier la ligue</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-7 w-7 place-items-center rounded-md text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">
          Nom
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className="mb-4 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-kop"
        />

        <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
          rows={3}
          className="mb-4 w-full resize-none rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-kop"
        />

        {error && (
          <div className="mb-3 text-[12.5px] font-semibold text-kop-bright">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-2.5">
          {confirmingDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-md bg-kop px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
            >
              {submitting ? "Suppression…" : "Confirmer la suppression"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-border-strong px-3 py-1.5 text-[12.5px] font-semibold text-text-3 transition-colors hover:border-kop hover:text-kop"
            >
              Supprimer
            </button>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-strong px-3.5 py-1.5 text-[12.5px] font-semibold text-text-2 transition-colors hover:bg-surface-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-kop px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:bg-kop-bright disabled:opacity-50"
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {confirmingDelete && (
          <p className="mt-3 text-[12px] text-text-3">
            La ligue, ses invitations et son chat seront définitivement supprimés.
            Les membres ne perdent que leur appartenance.
          </p>
        )}
      </form>
    </Modal>
  );
}

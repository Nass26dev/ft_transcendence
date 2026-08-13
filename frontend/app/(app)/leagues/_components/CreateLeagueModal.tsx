"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

/** Modale de création d'une ligue : formulaire nom + description avec validation basique. */
export function CreateLeagueModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Nom et description requis.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(name.trim(), description.trim());
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Impossible de créer la ligue.";
      setError(msg);
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
          <h3 className="font-display text-lg font-bold">Créer une ligue</h3>
          <button
            type="button"
            onClick={onClose}
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
          placeholder="Les Kopistes du Mardi"
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
          placeholder="Une courte description de ta ligue"
          className="mb-4 w-full resize-none rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-kop"
        />

        {error && (
          <div className="mb-3 text-[12.5px] font-semibold text-kop-bright">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5">
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
            className="inline-flex items-center gap-1.5 rounded-md bg-kop px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:bg-kop-bright disabled:opacity-50"
          >
            {submitting ? "Création…" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

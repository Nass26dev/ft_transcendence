import React from "react";
import api from "@/utils/api";
import { num, errMessage } from "./helpers";

/** Éditeur de solde Kops d'un utilisateur, avec validation (nombre positif) et sauvegarde. */
export function WalletEditor({
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

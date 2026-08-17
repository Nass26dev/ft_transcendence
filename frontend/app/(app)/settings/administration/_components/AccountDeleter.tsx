import React from "react";
import api from "@/utils/api";
import { errMessage } from "./helpers";
import type { UserDetail } from "./types";

/** Suppression définitive d'un compte depuis l'administration.
 *
 *  La confirmation se fait en deux temps dans le composant lui-même : l'action
 *  est irréversible et emporte en cascade les paris, amitiés, messages et
 *  ligues créées par le compte. Les garde-fous (owner protégé, admin
 *  supprimable seulement par un owner, pas d'auto-suppression) sont appliqués
 *  côté serveur ; ils sont repris ici pour ne pas proposer un bouton qui
 *  échouerait. */
export function AccountDeleter({
  user,
  isOwner,
  currentUserId,
  onDeleted,
}: {
  user: UserDetail;
  isOwner: boolean;
  currentUserId: number;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");

  const isSelf = user.id === currentUserId;
  const protectedOwner = user.status === "owner" && !isOwner;
  const protectedAdmin = user.status === "admin" && !isOwner;
  const blocked = isSelf || protectedOwner || protectedAdmin;

  const reason = isSelf
    ? "Tu ne peux pas supprimer ton propre compte depuis l'administration."
    : protectedOwner
      ? "Seul un owner peut supprimer un owner."
      : protectedAdmin
        ? "Seul un owner peut supprimer un admin."
        : "";

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/api/admin/users/${user.id}/`);
      onDeleted();
    } catch (e) {
      setError(errMessage(e, "Erreur lors de la suppression."));
      setDeleting(false);
    }
  };

  if (blocked) {
    return <p className="text-[13px] text-text-3">{reason}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-text-3">
        Supprime définitivement le compte de{" "}
        <span className="font-semibold text-text">{user.username}</span>, ainsi que ses
        paris, ses relations d&apos;amitié, ses messages et les ligues dont il est le
        créateur. Cette action est irréversible.
      </p>

      {error && <p className="text-[13px] font-semibold text-kop-bright">{error}</p>}

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-[8px] bg-kop px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-kop-bright disabled:opacity-50"
          >
            {deleting ? "Suppression…" : `Oui, supprimer ${user.username}`}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="rounded-[8px] border border-border-strong px-3.5 py-2 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface-2"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="self-start rounded-[8px] border border-border-strong px-3.5 py-2 text-[13px] font-semibold text-text-3 transition-colors hover:border-kop hover:text-kop"
        >
          Supprimer ce compte
        </button>
      )}
    </div>
  );
}

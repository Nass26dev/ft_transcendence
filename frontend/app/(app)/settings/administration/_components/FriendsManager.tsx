import React from "react";
import api from "@/utils/api";
import type { Friend } from "./types";

/** Liste des amis d'un utilisateur avec possibilité de retirer une relation d'amitié. */
export function FriendsManager({
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

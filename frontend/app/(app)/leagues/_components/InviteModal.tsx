"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useFriends } from "@/hooks/useFriends";
import type { ApiLeague } from "@/utils/types";

export function InviteModal({
  league,
  onClose,
  onInvite,
}: {
  league: ApiLeague;
  onClose: () => void;
  /** Doit lever en cas d'échec (message backend) pour afficher l'erreur. */
  onInvite: (receiverId: number) => Promise<void>;
}) {
  const { friends, loading } = useFriends();
  const [query, setQuery] = React.useState("");
  // id ami -> "sending" | "done" | message d'erreur
  const [state, setState] = React.useState<Record<number, string>>({});

  const filtered = friends.filter((f) =>
    f.user.username.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function handleInvite(receiverId: number) {
    setState((s) => ({ ...s, [receiverId]: "sending" }));
    try {
      await onInvite(receiverId);
      setState((s) => ({ ...s, [receiverId]: "done" }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Échec";
      setState((s) => ({ ...s, [receiverId]: msg }));
    }
  }

  return (
    <Modal
      onClose={onClose}
      className="flex max-h-[80vh] w-full max-w-[440px] flex-col rounded-[14px] border border-border bg-surface-1 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
    >
      <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Inviter dans la ligue</h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="mb-4 text-[12.5px] text-text-3">{league.name}</div>

        <div className="relative mb-3">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3">
            <Icon name="search" size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un ami"
            className="w-full rounded-md border border-border bg-surface-2 py-2 pl-8 pr-3 text-sm outline-none focus:border-kop"
          />
        </div>

        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="py-6 text-center text-[13px] text-text-3">
              Chargement des amis…
            </div>
          ) : friends.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-text-3">
              Tu n&apos;as pas encore d&apos;amis à inviter.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-text-3">
              Aucun ami ne correspond.
            </div>
          ) : (
            filtered.map((f) => {
              const st = state[f.user.id];
              const done = st === "done";
              const sending = st === "sending";
              const error = st && st !== "sending" && st !== "done" ? st : null;
              return (
                <div
                  key={f.user.id}
                  className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-3 text-text-2">
                    <Icon name="user" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {f.user.username}
                    </div>
                    {error && (
                      <div className="truncate text-[11px] text-kop-bright">
                        {error}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleInvite(f.user.id)}
                    disabled={sending || done}
                    className={[
                      "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-60",
                      done
                        ? "border border-green text-green"
                        : "bg-kop text-white hover:bg-kop-bright",
                    ].join(" ")}
                  >
                    {done ? "Invité ✓" : sending ? "…" : "Inviter"}
                  </button>
                </div>
              );
            })
          )}
        </div>
    </Modal>
  );
}

"use client";

import React from "react";
import { Tag } from "@/components/ui/Tag";
import { useFriendsFeed } from "@/hooks/useFriendsFeed";

/** Couleur de pastille déterministe à partir du pseudo (fallback sans avatar). */
const PALETTE = [
  "#FF6B6B", "#4A8DFF", "#A3FF12", "#FFD60A",
  "#C9184A", "#9B5DE5", "#00BBF9", "#F15BB5",
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function RailFriendsFeed() {
  const { items, loading } = useFriendsFeed();

  return (
    <div className="rounded-[10px] border border-border bg-surface-1">
      <div className="flex items-center justify-between border-b border-border p-3.5">
        <h3 className="font-display text-base">Le feed des potes</h3>
        <Tag kind="green">Live</Tag>
      </div>

      {loading ? (
        <div className="px-3.5 py-4 text-[12px] text-text-3">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="px-3.5 py-4 text-[12px] text-text-3">
          Aucune activité récente de tes amis. Ajoute des potes pour voir leurs
          paris ici.
        </div>
      ) : (
        <div>
          {items.slice(0, 5).map((f) => {
            const bg = avatarColor(f.user);
            return (
              <div
                key={f.id}
                className="flex gap-2.5 border-b border-border px-3.5 py-3 last:border-b-0"
              >
                {f.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.avatar}
                    alt={f.user}
                    className="h-8 w-8 flex-none rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="grid h-8 w-8 flex-none place-items-center rounded-full text-[12px] font-bold"
                    style={{
                      background: bg,
                      color:
                        bg === "#FFD60A" || bg === "#A3FF12" ? "#000" : "#fff",
                    }}
                  >
                    {f.user[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">
                    {f.user}{" "}
                    <span className="text-[11px] font-medium text-text-3">
                      · {f.when}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-text-3">
                    <span className="text-text-2">{f.desc}</span>{" "}
                    <span
                      className="font-semibold"
                      style={{
                        color: f.kind === "won" ? "var(--green)" : "var(--text)",
                      }}
                    >
                      {f.pick}
                    </span>
                  </div>
                  {f.kind === "won" && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Tag kind="green">Gagné</Tag>
                    </div>
                  )}
                  {f.kind === "combo" && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Tag>Combiné</Tag>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

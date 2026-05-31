import React from "react";
import { Tag } from "@/components/ui/Tag";
import { FRIENDS_FEED } from "@/data/kop-data";

export function RailFriendsFeed() {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1">
      <div className="flex items-center justify-between border-b border-border p-3.5">
        <h3 className="font-display text-base">Le feed des potes</h3>
        <Tag kind="green">Live</Tag>
      </div>
      <div>
        {FRIENDS_FEED.slice(0, 5).map((f) => (
          <div
            key={f.id}
            className="flex gap-2.5 border-b border-border px-3.5 py-3 last:border-b-0"
          >
            <div
              className="grid h-8 w-8 flex-none place-items-center rounded-full text-[12px] font-bold"
              style={{
                background: f.avatar,
                color:
                  f.avatar === "#FFD60A" || f.avatar === "#A3FF12"
                    ? "#000"
                    : "#fff",
              }}
            >
              {f.user[0]}
            </div>
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
                  <Tag>Combiné x4</Tag>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

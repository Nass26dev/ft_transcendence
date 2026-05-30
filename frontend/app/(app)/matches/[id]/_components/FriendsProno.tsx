import React from "react";
import { getAvatarTextColor } from "@/utils/styles";
import { FRIENDS_FEED } from "@/data/kop-data";

export function FriendsProno() {
  return (
    <div className="rounded-[10px] border border-border bg-surface-1 p-5">
      <h3 className="mb-3 font-display text-base font-bold">Pronos des potes</h3>
      {FRIENDS_FEED.slice(0, 3).map((f, i, arr) => (
        <div
          key={f.id}
          className={[
            "flex items-center gap-2.5 py-2",
            i < arr.length - 1 ? "border-b border-border" : "",
          ].join(" ")}
        >
          <div
            className="grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-bold"
            style={{
              background: f.avatar,
              color: getAvatarTextColor(f.avatar),
            }}
          >
            {f.user[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">{f.user}</div>
            <div className="truncate text-[11.5px] text-text-3">{f.pick}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

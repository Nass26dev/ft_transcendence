import React from "react";
import { Kops } from "@/components/ui/Kops";
import { getRankColor, getDeltaColor, getAvatarTextColor } from "@/utils/styles";
import type { LeagueBoardEntry } from "@/utils/types";

export function LeaderboardRow({
  r,
  avatarColor,
}: {
  r: LeagueBoardEntry;
  avatarColor: string;
}) {
  return (
    <div
      className={[
        "grid grid-cols-[50px_1fr_100px_100px_110px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
        r.me ? "border-l-[3px] border-l-kop bg-kop/5 pl-[13px]" : "",
      ].join(" ")}
    >
      <span className={`font-display text-lg font-bold ${getRankColor(r.rank)}`}>
        {r.rank}
      </span>

      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-bold"
          style={{
            background: avatarColor,
            color: getAvatarTextColor(avatarColor),
          }}
        >
          {r.user[0]}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.user}</div>
          <div className="truncate text-[11.5px] text-text-3">{r.handle}</div>
        </div>
      </div>

      <span className="text-right font-mono tnum text-[13px] font-semibold">
        {r.wr}
      </span>
      <span
        className={`text-right font-mono tnum text-[13px] font-semibold ${getDeltaColor(r.weekDelta)}`}
      >
        {r.weekDelta}
      </span>
      <span className="text-right">
        <Kops amount={r.kops} size={13} />
      </span>
    </div>
  );
}

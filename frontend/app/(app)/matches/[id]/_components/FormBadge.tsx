import React from "react";
import type { FormResult } from "@/utils/matchDetail";

export function FormBadge({ r }: { r: FormResult }) {
  const styles = {
    W: "bg-green text-black",
    D: "bg-text-3 text-white",
    L: "bg-kop text-white",
  } as const;
  return (
    <span
      className={`grid h-[18px] w-[18px] place-items-center rounded text-[10px] font-bold ${styles[r]}`}
    >
      {r}
    </span>
  );
}

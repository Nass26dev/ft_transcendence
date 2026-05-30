"use client";

import React from "react";

export function SlipFab({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 rounded-full bg-kop px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_var(--kop)] transition-colors hover:bg-kop-bright"
    >
      🎟️ Mon ticket · {count} {count > 1 ? "paris" : "pari"}
    </button>
  );
}

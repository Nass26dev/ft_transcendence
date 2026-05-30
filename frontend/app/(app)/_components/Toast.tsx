import React from "react";
import type { Toast as ToastData } from "@/utils/types";

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;

  return (
    <div className="fixed right-6 top-20 z-[200] flex items-center gap-2.5 rounded-[10px] border border-green bg-surface-2 px-4 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-green text-[12px] font-black text-black">
        ✓
      </span>
      {toast.msg}
    </div>
  );
}

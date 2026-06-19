"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { dropdownVariants } from "@/components/ui/motion";
import {
  useNotifications,
  type AppNotification,
  type NotificationType,
} from "@/hooks/useNotifications";

const TYPE_ICON: Record<NotificationType, string> = {
  dm: "💬",
  friend_request: "👤",
  league_invite: "🏆",
  bet_settled: "🎟️",
};

/** Durée écoulée compacte en français : « à l'instant », « 14 min », « 2 h », « 3 j ». */
function relativeFr(iso: string): string {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  if (secs < 60) return "à l'instant";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "hier" : `${days} j`;
}

export function NotificationBell() {
  const { items, unread, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Ferme le panneau au clic à l'extérieur.
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleClick(n: AppNotification) {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.url) router.push(n.url);
  }

  return (
    <div ref={ref} className="relative">
      <button
        title="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-text-2 transition-colors hover:bg-surface-1 hover:text-text"
      >
        <Icon name="bell" size={18} stroke={1.8} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-kop px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          style={{ transformOrigin: "top right" }}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-border-strong bg-surface-1 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-display text-[15px] font-bold">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-semibold text-text-3 transition-colors hover:text-kop-bright"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-text-3">
                Aucune notification pour l&apos;instant.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={[
                    "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2",
                    n.is_read ? "" : "bg-surface-2/60",
                  ].join(" ")}
                >
                  <span className="mt-0.5 text-[16px] leading-none">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug text-text">
                      {n.message}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-3">
                      {relativeFr(n.created_at)}
                    </span>
                  </span>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-kop" />
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

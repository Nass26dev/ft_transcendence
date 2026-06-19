"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { dropdownVariants } from "@/components/ui/motion";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";
import { searchUsers, type SearchUser } from "@/hooks/useFriends";
import { userInitials } from "@/utils/user";

export function TopbarSearch() {
  const router = useRouter();
  const { isAuthenticated } = useProfile();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchUser[]>([]);
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Recherche débouncée (joueurs uniquement pour l'instant).
  React.useEffect(() => {
    const q = query.trim();
    if (!isAuthenticated || q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setResults((await searchUsers(q)).slice(0, 6));
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, isAuthenticated]);

  // Fermer au clic extérieur.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToFriends = (q: string) => {
    setOpen(false);
    router.push(`/friends?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={boxRef} className="relative hidden min-w-0 max-w-[420px] flex-1 sm:block">
      <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface-1 px-3 py-2.5">
        <Icon name="search" size={16} stroke={1.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim().length >= 2) goToFriends(query.trim());
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Rechercher un joueur…"
          size={1}
          className="w-full min-w-0 flex-1 border-none bg-transparent text-[13.5px] outline-none placeholder:text-text-3"
        />
      </div>

      <AnimatePresence>
      {open && query.trim().length >= 2 && (
        <motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          style={{ transformOrigin: "top" }}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[10px] border border-border bg-surface-1 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)]">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-[13px] text-text-3">Aucun joueur trouvé.</div>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                onClick={() => goToFriends(u.username || u.email)}
                className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-surface-2"
              >
                <Avatar
                  src={u.avatar}
                  initials={userInitials(u)}
                  className="h-8 w-8 text-[12px]"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{u.username || u.email}</div>
                  <div className="truncate text-[11px] text-text-3">{u.email}</div>
                </div>
                {u.status === "friends" && (
                  <span className="flex-none text-[11px] font-semibold text-green">Ami ✓</span>
                )}
                {u.status === "pending_sent" && (
                  <span className="flex-none text-[11px] text-text-3">Envoyée</span>
                )}
              </button>
            ))
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

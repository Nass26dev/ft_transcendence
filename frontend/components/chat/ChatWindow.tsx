"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { useChatRoom } from "@/hooks/useChatRoom";
import type { ChatMessage } from "@/utils/chat";

export interface ActiveRoom {
  kind: "dm" | "league";
  /** id de conversation (DM) ou de ligue. */
  id: number;
  title: string;
  subtitle?: string;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Regroupe le rendu d'une bulle de message. */
function MessageRow({
  msg,
  mine,
  showAuthor,
}: {
  msg: ChatMessage;
  mine: boolean;
  showAuthor: boolean;
}) {
  return (
    <div className={["flex flex-col", mine ? "items-end" : "items-start"].join(" ")}>
      {showAuthor && !mine && (
        <span className="mb-0.5 px-1 text-[11px] font-semibold text-text-3">
          {msg.username}
        </span>
      )}
      <div
        className={[
          "max-w-[75%] rounded-[12px] px-3 py-2 text-[13.5px] leading-snug",
          mine
            ? "bg-kop text-white rounded-br-sm"
            : "bg-surface-2 text-text rounded-bl-sm",
        ].join(" ")}
      >
        <span className="whitespace-pre-wrap break-words">{msg.content}</span>
      </div>
      <span className="mt-0.5 px-1 text-[10px] text-text-3">
        {timeLabel(msg.created_at)}
      </span>
    </div>
  );
}

export function ChatWindow({
  room,
  currentUserId,
}: {
  room: ActiveRoom;
  currentUserId: number;
}) {
  const wsPath =
    room.kind === "dm" ? `ws/dm/${room.id}/` : `ws/chat/${room.id}/`;
  const historyUrl =
    room.kind === "dm"
      ? `/api/chat/conversations/${room.id}/messages/`
      : `/api/chat/leagues/${room.id}/messages/`;

  const { messages, status, loading, send } = useChatRoom(wsPath, historyUrl);
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (send(draft)) setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <div
          className={[
            "grid h-9 w-9 flex-none place-items-center rounded-full text-[13px] font-bold text-white",
            room.kind === "dm"
              ? "bg-gradient-to-br from-[#FF6B6B] to-[#C9184A]"
              : "bg-gradient-to-br from-[#3A86FF] to-[#1D3F6B]",
          ].join(" ")}
        >
          {room.kind === "league" ? (
            <Icon name="league" size={18} stroke={1.8} />
          ) : (
            room.title.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold">{room.title}</div>
          <div className="truncate text-[11.5px] text-text-3">
            {status === "open"
              ? room.subtitle ?? "En ligne"
              : status === "connecting"
                ? "Connexion…"
                : "Hors ligne"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="py-8 text-center text-[13px] text-text-3">
            Chargement des messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-text-3">
            Aucun message pour l&apos;instant — lance la discussion ! 👋
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showAuthor = !prev || prev.sender_id !== m.sender_id;
              return (
                <MessageRow
                  key={m.id}
                  msg={m}
                  mine={m.sender_id === currentUserId}
                  showAuthor={showAuthor && room.kind === "league"}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Saisie */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-border px-4 py-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écris un message…"
          className="flex-1 rounded-[10px] border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] outline-none placeholder:text-text-3 focus:border-border-strong"
        />
        <button
          type="submit"
          disabled={!draft.trim() || status !== "open"}
          className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-kop text-white transition-colors hover:bg-kop-bright disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Icon name="arrow" size={18} stroke={2} />
        </button>
      </form>
    </div>
  );
}

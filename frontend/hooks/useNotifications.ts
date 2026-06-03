"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/utils/api";
import { wsUrl } from "@/utils/chat";
import { useProfile } from "@/app/(app)/_components/ProfileProvider";

export type NotificationType =
  | "dm"
  | "friend_request"
  | "league_invite"
  | "bet_settled";

export interface AppNotification {
  id: number;
  type: NotificationType;
  actor: string | null;
  message: string;
  url: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/** Notifications de l'utilisateur : historique REST + flux temps réel (WebSocket). */
export function useNotifications() {
  const { isAuthenticated, ready } = useProfile();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement initial ────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications/");
      setItems(res.data.results ?? []);
      setUnread(res.data.unread ?? 0);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setItems([]);
      setUnread(0);
      return;
    }
    load();
  }, [ready, isAuthenticated, load]);

  // ── Flux temps réel (avec reconnexion) ─────────────────────────────
  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    let closedByUs = false;

    const connect = () => {
      const ws = new WebSocket(wsUrl("ws/notifications/"));
      socketRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === "notification" && data.notification) {
            const n: AppNotification = data.notification;
            setItems((prev) =>
              prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 30),
            );
            setUnread((u) => u + 1);
          }
        } catch {
          /* message non-JSON ignoré */
        }
      };

      ws.onclose = () => {
        if (closedByUs) return;
        reconnectRef.current = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closedByUs = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [ready, isAuthenticated]);

  // ── Actions ────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await api.post("/api/notifications/read-all/");
    } catch (err) {
      console.error("Erreur marquage notifications:", err);
    }
  }, []);

  const markRead = useCallback(async (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    try {
      const res = await api.post(`/api/notifications/${id}/read/`);
      setUnread(res.data.unread ?? 0); // valeur autoritative du serveur
    } catch (err) {
      console.error("Erreur marquage notification:", err);
    }
  }, []);

  return { items, unread, markAllRead, markRead, reload: load };
}

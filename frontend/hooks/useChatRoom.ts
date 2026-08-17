"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/utils/api";
import { closeSocket, wsUrl, type ChatMessage } from "@/utils/chat";

export type ConnectionStatus = "connecting" | "open" | "closed";

interface ApiHistoryMessage {
  id: number;
  content: string;
  created_at: string;
  sender: { id: number; username: string; avatar: string | null };
}

interface WsIncoming {
  id: number;
  message: string;
  sender_id: number;
  username: string;
  created_at: string;
}

/** Salle de chat temps réel (DM ou ligue).
 *
 *  - `wsPath`     : chemin WebSocket, ex "ws/chat/3/" ou "ws/dm/7/".
 *  - `historyUrl`: endpoint REST de l'historique (null = pas de salle active).
 *
 *  Charge l'historique via REST puis ouvre le WebSocket. Les nouveaux messages
 *  (y compris les nôtres, renvoyés en écho par le serveur) arrivent par le WS.
 *  En cas de coupure non voulue, le WebSocket se reconnecte automatiquement
 *  tant que la salle (`wsPath`) reste active. */
export function useChatRoom(wsPath: string | null, historyUrl: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("closed");
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Évite les reconnexions d'une salle qu'on vient de quitter. */
  const activePathRef = useRef<string | null>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  }, []);

  useEffect(() => {
    if (!historyUrl) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    api
      .get<ApiHistoryMessage[]>(historyUrl)
      .then((res) => {
        if (cancelled) return;
        setMessages(
          res.data.map((m) => ({
            id: m.id,
            content: m.content,
            created_at: m.created_at,
            sender_id: m.sender.id,
            username: m.sender.username,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) console.error("Erreur chargement historique chat:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [historyUrl]);

  useEffect(() => {
    activePathRef.current = wsPath;
    if (!wsPath) {
      setStatus("closed");
      return;
    }

    let closedByUs = false;

    const connect = () => {
      if (activePathRef.current !== wsPath) return;
      setStatus("connecting");
      const socket = new WebSocket(wsUrl(wsPath));
      socketRef.current = socket;

      socket.onopen = () => setStatus("open");

      socket.onmessage = (event) => {
        try {
          const data: WsIncoming = JSON.parse(event.data);
          appendMessage({
            id: data.id,
            content: data.message,
            created_at: data.created_at,
            sender_id: data.sender_id,
            username: data.username,
          });
        } catch {
        }
      };

      socket.onclose = () => {
        setStatus("closed");
        if (!closedByUs && activePathRef.current === wsPath) {
          reconnectRef.current = setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      closeSocket(socketRef.current);
      socketRef.current = null;
    };
  }, [wsPath, appendMessage]);

  const send = useCallback((content: string): boolean => {
    const text = content.trim();
    const socket = socketRef.current;
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ content: text }));
    return true;
  }, []);

  return { messages, status, loading, send };
}

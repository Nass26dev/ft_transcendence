/** Utilitaires partagés par le chat (DM + ligues). */

export interface ChatUser {
  id: number;
  username: string;
  avatar: string | null;
}

/** Message normalisé affiché dans une fenêtre de chat (DM ou ligue). */
export interface ChatMessage {
  /** id serveur ; négatif/temporaire pour les messages optimistes locaux. */
  id: number;
  content: string;
  created_at: string;
  sender_id: number;
  username: string;
}

/** Conversation DM telle que renvoyée par GET /api/chat/conversations/. */
export interface Conversation {
  id: number;
  peer: ChatUser;
  last_message: string | null;
  last_message_at: string;
}

/** Ferme un WebSocket sans polluer la console.
 *
 *  Appeler `close()` sur une socket encore en CONNECTING fait écrire au
 *  navigateur « WebSocket is closed before the connection is established »,
 *  ce qui arrive à chaque fois qu'on quitte une page avant la fin du
 *  handshake. On attend donc l'ouverture pour refermer proprement. */
export function closeSocket(socket: WebSocket | null | undefined): void {
  if (!socket) return;
  if (socket.readyState === WebSocket.CONNECTING) {
    socket.addEventListener("open", () => socket.close(), { once: true });
    return;
  }
  if (socket.readyState === WebSocket.OPEN) socket.close();
}

/** Construit l'URL WebSocket à partir de NEXT_PUBLIC_API_URL.
 *  Ex: http://localhost:8000/ + "ws/chat/3/" -> ws://localhost:8000/ws/chat/3/ */
export function wsUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const wsBase = base.replace(/^http/, "ws");
  const clean = path.replace(/^\//, "");
  return `${wsBase}/${clean}`;
}

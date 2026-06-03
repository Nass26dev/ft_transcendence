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

/** Construit l'URL WebSocket à partir de NEXT_PUBLIC_API_URL.
 *  Ex: http://localhost:8000/ + "ws/chat/3/" -> ws://localhost:8000/ws/chat/3/ */
export function wsUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const wsBase = base.replace(/^http/, "ws"); // http->ws, https->wss
  const clean = path.replace(/^\//, "");
  return `${wsBase}/${clean}`;
}

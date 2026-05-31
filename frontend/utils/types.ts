// ============================================================
// Types partagés Kop
// ============================================================

// ---------- Domain entities ----------

export interface Team {
  /** Nom complet (ex: "Paris SG") */
  n: string;
  /** Short / abréviation (ex: "PSG") */
  sh: string;
  /** Couleur de fond du crest */
  c: string;
  /** Couleur du texte sur le crest */
  t: string;
}

export interface League {
  /** Nom (ex: "Ligue 1") */
  n: string;
  /** Emoji flag */
  flag: string;
}

export type OddKey = "1" | "X" | "2";
export type Trend = "up" | "down";

export interface Match {
  id: string;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  status?: "soon" | "live" | "done";

  odds: Record<OddKey, number>;
  conf?: Record<OddKey, number>;
  trend?: Partial<Record<OddKey, Trend>>;

  // Live only
  minute?: number;
  scoreH?: number;
  scoreA?: number;

  // ---- Champs renvoyés par l'API backend (snake_case) ----
  // Présents en plus de la forme courte ci-dessus, le temps de finir la
  // migration mock -> API. À nettoyer/unifier plus tard.
  competition?: string;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  current_minute?: number;
  kickoff_at?: string;
}

// ---------- Betting ----------

export type BetStatus = "pending" | "won" | "lost";

export interface BetPick {
  match: string;
  pick: string;
  odd: number;
  status: BetStatus;
}

export interface Bet {
  id: string;
  date: string;
  kind: string;
  stake: number;
  payout: number;
  odd: number;
  status: BetStatus;
  picks: BetPick[];
}

// Pick actif dans le BetSlip (différent d'un BetPick historique)
export interface SlipPick {
  id: string;
  matchId: string;
  k: string;
  game: string;
  label: string;
  odd: number;
}

export interface PlacePayload {
  stake: number;
  payout: number;
  totalOdd: number;
  picks: SlipPick[];
}

// ---------- Social / engagement ----------

export type FriendBetKind = "simple" | "combo" | "won" | "league";

export interface FriendBet {
  id: string;
  user: string;
  avatar: string;
  when: string;
  desc: string;
  pick: string;
  kind: FriendBetKind;
}

export interface LeagueBoardEntry {
  rank: number;
  user: string;
  handle: string;
  kops: number;
  weekDelta: string;
  wr: string;
  me?: boolean;
}

export interface Challenge {
  id: string;
  icon: string;
  ttl: string;
  desc: string;
  progress: number;
  total: number;
  reward: number;
}

export interface SeasonChallenge {
  ttl: string;
  desc: string;
  progress: number;
  total: number;
  reward: number;
}

export interface Trending {
  tag: string;
  vol: string;
  odd: number;
}

export interface CompetitionStat {
  lg: string;
  flag: string;
  bets: number;
  wr: number;
  roi: string;
}

export interface Badge {
  e: string;
  n: string;
  d: string;
  locked?: boolean;
}

export interface LeagueCardData {
  n: string;
  d: number;
  w: string;
  emoji: string;
  mine?: boolean;
}

export interface PublicLeague {
  n: string;
  members: number;
  emoji: string;
  desc: string;
}

// ---------- UI ----------

export type TagKind = "default" | "live" | "soon" | "green";

// Handlers partagés entre screens et cards
export interface MatchHandlers {
  onPick: (match: Match, k: string, customLabel?: string) => void;
  isPicked: (matchId: string, k: string) => boolean;
  onOpen: (id: string) => void;
}

// Alias historique (anciennement utilisé par les cards et HomeScreen)
export type PickHandlers = MatchHandlers;

// ---------- Toast ----------

export interface Toast {
  type: "ok" | "err";
  msg: string;
}
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
  /** Répartition des paris des Kopistes (% sur 1/X/2), renvoyée par l'API. */
  conf?: Record<OddKey, number>;
  /** Nombre total de paris pris sur ce match (pour l'état "0 pari"). */
  bets_total?: number;
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

/** Pari "tendance" renvoyé par GET /api/betting/trending/. */
export interface TrendingBet {
  match_id: number;
  label: string;
  selection: "home" | "draw" | "away";
  count: number;
  share: number;
  odd: number;
  home_team: string;
  away_team: string;
  window: "1h" | "24h" | "all";
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

/** Défi renvoyé par GET /api/challenges/. */
export interface ApiChallenge {
  code: string;
  kind: "daily" | "season";
  icon: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

/** Badge renvoyé par GET /api/badges/. */
export interface ApiBadge {
  code: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlocked_at: string | null;
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

/** Ligue renvoyée par l'API backend (GET /api/league/list|all-league). */
export interface ApiLeague {
  id: number;
  name: string;
  description: string;
  /** Pseudo du créateur. */
  creator: string;
  members_count: number;
}

/** Entrée de classement renvoyée par GET /api/leaderboard/. */
export interface ApiLeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  /** Gains nets sur la période (bénéfice). */
  net: number;
  /** Gains nets sur les 7 derniers jours. */
  week_net: number;
  /** Taux de réussite en % (paris gagnés / paris réglés). */
  win_rate: number;
  /** Nombre de paris réglés sur la période. */
  bets: number;
  me: boolean;
}

/** Invitation reçue, renvoyée par GET /api/league/invitations/. */
export interface ApiLeagueInvitation {
  id: number;
  /** Pseudo de l'expéditeur. */
  sender: string;
  /** Nom de la ligue. */
  league: string;
}

/** Entrée du feed d'activité des amis, renvoyée par GET /api/friends/feed/. */
export interface ApiFriendFeedItem {
  id: number;
  /** Pseudo de l'ami. */
  user: string;
  /** URL d'avatar, ou null (le front génère alors une pastille colorée). */
  avatar: string | null;
  /** Durée écoulée, ex. « 14 min », « hier ». */
  when: string;
  /** Phrase d'action, ex. « a parié 500 K sur ». */
  desc: string;
  /** Détail du pari, ex. « PSG vainqueur @ 1.45 ». */
  pick: string;
  kind: "won" | "lost" | "simple" | "combo";
}

/** Membre classé d'une ligue, renvoyé par GET /api/league/<id>/leaderboard/. */
export interface ApiLeagueBoardEntry {
  rank: number;
  user_id: number;
  username: string;
  /** Solde Kops courant. */
  kops: number;
  me: boolean;
}

/** Réponse de GET /api/league/<id>/leaderboard/. */
export interface ApiLeagueBoard {
  id: number;
  name: string;
  members_count: number;
  entries: ApiLeagueBoardEntry[];
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
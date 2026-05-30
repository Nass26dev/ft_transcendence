import type {
  Team,
  League,
  Match,
  Bet,
  FriendBet,
  LeagueBoardEntry,
  Challenge,
  SeasonChallenge,
  Trending,
} from "@/utils/types";

export const TEAMS: Record<string, Team> = {
  PSG: { n: "Paris SG", sh: "PSG", c: "#004170", t: "#fff" },
  OM: { n: "Marseille", sh: "OM", c: "#2FAEE0", t: "#fff" },
  OL: { n: "Lyon", sh: "OL", c: "#001E62", t: "#fff" },
  RCL: { n: "Lens", sh: "RCL", c: "#FFCD00", t: "#000" },
  ASM: { n: "Monaco", sh: "ASM", c: "#CE1126", t: "#fff" },
  RCSA: { n: "Strasbourg", sh: "RCSA", c: "#005EB8", t: "#fff" },
  STADE: { n: "Rennes", sh: "SRFC", c: "#E30613", t: "#fff" },
  LOSC: { n: "Lille", sh: "LOSC", c: "#E11A22", t: "#fff" },
  FCN: { n: "Nantes", sh: "FCN", c: "#FFD800", t: "#000" },
  TFC: { n: "Toulouse", sh: "TFC", c: "#5F1E92", t: "#fff" },
  RMA: { n: "Real Madrid", sh: "RMA", c: "#FFFFFF", t: "#000" },
  FCB: { n: "Barcelona", sh: "FCB", c: "#A50044", t: "#fff" },
  BAY: { n: "Bayern", sh: "BAY", c: "#DC052D", t: "#fff" },
  CHE: { n: "Chelsea", sh: "CHE", c: "#034694", t: "#fff" },
  MCI: { n: "Man City", sh: "MCI", c: "#6CABDD", t: "#fff" },
  LIV: { n: "Liverpool", sh: "LIV", c: "#C8102E", t: "#fff" },
  ARS: { n: "Arsenal", sh: "ARS", c: "#EF0107", t: "#fff" },
  MUN: { n: "Man United", sh: "MUN", c: "#DA291C", t: "#fff" },
};

export const LEAGUES: Record<string, League> = {
  L1: { n: "Ligue 1", flag: "🇫🇷" },
  UCL: { n: "Champions League", flag: "⭐" },
  PL: { n: "Premier League", flag: "🇬🇧" },
  LIGA: { n: "La Liga", flag: "🇪🇸" },
  BUN: { n: "Bundesliga", flag: "🇩🇪" },
};

export const MATCHES: Match[] = [
  {
    id: "m1", league: "L1", home: "PSG", away: "OM", kickoff: "Sam 21:00", status: "soon",
    odds: { "1": 1.45, "X": 4.80, "2": 6.20 },
    conf: { "1": 68, "X": 18, "2": 14 },
    trend: { "1": "up", "2": "down" },
  },
  {
    id: "m2", league: "L1", home: "OL", away: "RCL", kickoff: "Sam 17:00", status: "soon",
    odds: { "1": 2.10, "X": 3.40, "2": 3.20 },
    conf: { "1": 42, "X": 28, "2": 30 },
  },
  {
    id: "m3", league: "UCL", home: "RMA", away: "BAY", kickoff: "Mar 21:00", status: "soon",
    odds: { "1": 2.30, "X": 3.50, "2": 2.85 },
    conf: { "1": 48, "X": 19, "2": 33 },
    trend: { "2": "up" },
  },
  {
    id: "m4", league: "L1", home: "STADE", away: "LOSC", kickoff: "Dim 15:00", status: "soon",
    odds: { "1": 2.55, "X": 3.30, "2": 2.65 },
    conf: { "1": 38, "X": 26, "2": 36 },
  },
  {
    id: "m5", league: "PL", home: "ARS", away: "LIV", kickoff: "Dim 17:30", status: "soon",
    odds: { "1": 2.60, "X": 3.40, "2": 2.55 },
    conf: { "1": 40, "X": 22, "2": 38 },
    trend: { "X": "down" },
  },
  {
    id: "m6", league: "L1", home: "ASM", away: "RCSA", kickoff: "Sam 19:00", status: "soon",
    odds: { "1": 1.65, "X": 4.00, "2": 4.80 },
    conf: { "1": 60, "X": 22, "2": 18 },
  },
];

export const LIVE: Match[] = [
  {
    id: "lv1", league: "PL", home: "CHE", away: "MUN",
    scoreH: 2, scoreA: 1, minute: 73,
    kickoff: "",
    status: "live",
    odds: { "1": 1.32, "X": 5.50, "2": 9.00 },
  },
  {
    id: "lv2", league: "UCL", home: "MCI", away: "FCB",
    scoreH: 1, scoreA: 1, minute: 58,
    kickoff: "",
    status: "live",
    odds: { "1": 2.10, "X": 3.10, "2": 3.50 },
  },
];

export const MY_BETS: Bet[] = [
  {
    id: "b1", date: "Auj. 18:42", kind: "Combiné x3",
    stake: 200, payout: 1620, odd: 8.10, status: "pending",
    picks: [
      { match: "PSG vs OM", pick: "PSG vainqueur", odd: 1.45, status: "pending" },
      { match: "Real vs Bayern", pick: "Plus de 2.5 buts", odd: 1.90, status: "pending" },
      { match: "Arsenal vs Liverpool", pick: "Les deux marquent", odd: 1.75, status: "pending" },
    ],
  },
  {
    id: "b2", date: "Hier 20:11", kind: "Simple",
    stake: 500, payout: 925, odd: 1.85, status: "won",
    picks: [{ match: "Lens vs Nantes", pick: "Lens vainqueur", odd: 1.85, status: "won" }],
  },
  {
    id: "b3", date: "Hier 14:30", kind: "Combiné x2",
    stake: 100, payout: 0, odd: 4.20, status: "lost",
    picks: [
      { match: "Rennes vs Lille", pick: "Match nul", odd: 3.30, status: "lost" },
      { match: "Monaco vs Strasbourg", pick: "Plus de 3.5 buts", odd: 1.27, status: "won" },
    ],
  },
];

export const FRIENDS_FEED: FriendBet[] = [
  { id: "f1", user: "Lucas", avatar: "#FF6B6B", when: "2 min", desc: "a parié 500 K sur", pick: "PSG vainqueur @ 1.45", kind: "simple" },
  { id: "f2", user: "Marwen", avatar: "#4A8DFF", when: "14 min", desc: "a fait un combiné x4", pick: "5000 K → 41 200 K potentiels", kind: "combo" },
  { id: "f3", user: "Nina", avatar: "#A3FF12", when: "32 min", desc: "a gagné", pick: "1820 K sur Lens", kind: "won" },
  { id: "f4", user: "Karim", avatar: "#FFD60A", when: "1h", desc: "a rejoint la ligue", pick: "Les Kopistes du Mardi", kind: "league" },
  { id: "f5", user: "Sofia", avatar: "#C9184A", when: "2h", desc: "a parié sur", pick: "Real Madrid vainqueur @ 2.30", kind: "simple" },
];

export const LEAGUE_BOARD: LeagueBoardEntry[] = [
  { rank: 1, user: "Marwen K.", handle: "@marwenK", kops: 124800, weekDelta: "+12 400", wr: "68%" },
  { rank: 2, user: "Lucas D.", handle: "@lukerd", kops: 98400, weekDelta: "+5 200", wr: "61%" },
  { rank: 3, user: "Nina V.", handle: "@nina_v", kops: 87100, weekDelta: "+8 900", wr: "64%" },
  { rank: 4, user: "Toi", handle: "@you", kops: 52300, weekDelta: "+1 850", wr: "54%", me: true },
  { rank: 5, user: "Karim B.", handle: "@karbz", kops: 48200, weekDelta: "-2 100", wr: "49%" },
  { rank: 6, user: "Sofia M.", handle: "@sofia.m", kops: 41600, weekDelta: "+800", wr: "52%" },
  { rank: 7, user: "Théo P.", handle: "@theop", kops: 36400, weekDelta: "-450", wr: "47%" },
  { rank: 8, user: "Inès F.", handle: "@inesf", kops: 28900, weekDelta: "+2 100", wr: "51%" },
];

export const CHALLENGES: Challenge[] = [
  { id: "c1", icon: "🎯", ttl: "Place 3 paris aujourd'hui", desc: "Toutes ligues confondues", progress: 2, total: 3, reward: 500 },
  { id: "c2", icon: "🔥", ttl: "Combiné gagnant x3", desc: "Cote totale > 5.00", progress: 0, total: 1, reward: 2000 },
  { id: "c3", icon: "⚡", ttl: "Streak de 5 paris", desc: "Plus que 2 paris en cours", progress: 3, total: 5, reward: 1500 },
];

export const TRENDING: Trending[] = [
  { tag: "PSG vainqueur", vol: "24 % des Kopistes", odd: 1.45 },
  { tag: "Real - Bayern : +2.5 buts", vol: "18 %", odd: 1.90 },
  { tag: "Arsenal & Liverpool BTTS", vol: "14 %", odd: 1.75 },
];

export const SEASON_CHALLENGES: SeasonChallenge[] = [
  {
    ttl: "Premier combiné gagnant",
    desc: "Termine un combiné x3 ou plus",
    progress: 0,
    total: 1,
    reward: 5000,
  },
  {
    ttl: "Streak hot",
    desc: "10 paris gagnants d'affilée",
    progress: 4,
    total: 10,
    reward: 10000,
  },
  {
    ttl: "Roi de la Ligue 1",
    desc: "Top 3 d'une ligue privée 4 sem.",
    progress: 1,
    total: 4,
    reward: 25000,
  },
];
export type Role = "owner" | "admin" | "user";

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  status: Role;
  wallet: number;
}

export interface Friend {
  id: number;
  username: string;
  email: string;
}

export interface BetSelection {
  id: number;
  match: string;
  odd: string;
  odd_value: number;
  status: string;
}

export interface Bet {
  id: number;
  stake: number;
  odd_value: number;
  status: string;
  created_at: string;
  settled_at: string | null;
  potential_win: number;
  selections: BetSelection[];
}

export interface UserDetail extends UserListItem {
  bio: string;
  onboarding_completed: boolean;
  last_daily_bonus: string | null;
  friends: Friend[];
  bets: Bet[];
}

export interface Stats {
  total_users: number;
  owners: number;
  admins: number;
  users: number;
  total_wallet: number;
  total_bets: number;
  pending_bets: number;
  won_bets: number;
}

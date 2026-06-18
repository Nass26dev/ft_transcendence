"use client";

import {
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  Home,
  LogOut,
  type LucideIcon,
  Medal,
  Menu,
  MessageCircle,
  Plus,
  Radio,
  Search,
  Settings,
  Shield,
  Star,
  Target,
  Ticket,
  TrendingUp,
  Trophy,
  User,
  Users,
  Volleyball,
  Wallet,
  X,
} from "lucide-react";

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
}

/** Associe les noms d'icônes historiques à leurs équivalents lucide-react. */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  menu: Menu,
  live: Radio,
  sports: Volleyball,
  ticket: Ticket,
  league: Medal,
  trophy: Trophy,
  flame: Flame,
  user: User,
  bell: Bell,
  camera: Camera,
  chat: MessageCircle,
  search: Search,
  settings: Settings,
  plus: Plus,
  x: X,
  chevron: ChevronRight,
  chevronD: ChevronDown,
  chevronL: ChevronLeft,
  check: Check,
  target: Target,
  coin: Coins,
  fire: Flame,
  chart: BarChart3,
  swap: ArrowRightLeft,
  star: Star,
  arrow: ArrowRight,
  shield: Shield,
  wallet: Wallet,
  users: Users,
  "trending-up": TrendingUp,
  "door-exit": LogOut,
};

export function Icon({ name, size = 18, stroke = 2, className }: IconProps) {
  const LucideComp = ICONS[name];
  if (!LucideComp) return null;
  const cls = className ? `icon ${className}` : "icon";
  return <LucideComp className={cls} size={size} strokeWidth={stroke} />;
}

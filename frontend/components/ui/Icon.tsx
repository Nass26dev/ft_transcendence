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
  Gift,
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

/** Associe les noms d'icônes historiques à leurs équivalents lucide-react. */
const ICONS = {
  home: Home,
  menu: Menu,
  live: Radio,
  sports: Volleyball,
  ticket: Ticket,
  league: Medal,
  trophy: Trophy,
  flame: Flame,
  gift: Gift,
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
} satisfies Record<string, LucideIcon>;

/** Nom d'icône valide (clé de la table ci-dessus). */
export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
}

/** Icône lucide-react rendue à partir d'un nom historique de la table ICONS. */
export function Icon({ name, size = 18, stroke = 2, className }: IconProps) {
  const LucideComp = ICONS[name];
  const cls = className ? `icon ${className}` : "icon";
  return <LucideComp className={cls} size={size} strokeWidth={stroke} />;
}

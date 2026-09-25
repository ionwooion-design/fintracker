import {
  Award,
  Bus,
  Crown,
  Ellipsis,
  Flag,
  Gamepad2,
  Gift,
  HeartPulse,
  House,
  Phone,
  Shield,
  Shirt,
  Sprout,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  "gamepad-2": Gamepad2,
  house: House,
  phone: Phone,
  "heart-pulse": HeartPulse,
  shirt: Shirt,
  gift: Gift,
  ellipsis: Ellipsis,
  wallet: Wallet,
  flag: Flag,
  sprout: Sprout,
  award: Award,
  shield: Shield,
  crown: Crown,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Ellipsis;
  return <Icon className={className} strokeWidth={1.75} />;
}

import {
  Briefcase,
  Car,
  Coffee,
  Fuel,
  Gamepad2,
  Gift,
  Heart,
  Home,
  MoreHorizontal,
  PiggyBank,
  ReceiptText,
  ShoppingBag,
  Utensils,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { normalizeTemplateColor, normalizeTemplateIcon, type QuickAddTemplateColor } from "@/lib/quick-add";

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Coffee,
  Fuel,
  Car,
  ShoppingBag,
  ReceiptText,
  Home,
  Heart,
  Gift,
  Gamepad2,
  Briefcase,
  Wallet,
  PiggyBank,
  MoreHorizontal,
};

const COLOR_CLASS_MAP: Record<QuickAddTemplateColor, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950/45 dark:text-teal-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/45 dark:text-rose-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

type TemplateIconProps = {
  icon?: string | null;
  color?: string | null;
  className?: string;
  size?: number;
};

export default function TemplateIcon({
  icon,
  color,
  className = "",
  size = 16,
}: TemplateIconProps) {
  const iconName = normalizeTemplateIcon(icon);
  const tone = normalizeTemplateColor(color);
  const Icon = ICON_MAP[iconName] ?? ReceiptText;

  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${COLOR_CLASS_MAP[tone]} ${className}`}
    >
      <Icon size={size} />
    </span>
  );
}

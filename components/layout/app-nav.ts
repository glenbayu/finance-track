import {
  BarChart3,
  Ellipsis,
  Home,
  PlusCircle,
  ReceiptText,
  Settings,
  Tags,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type AppNavKey =
  | "dashboard"
  | "transactions"
  | "reports"
  | "budgets"
  | "categories"
  | "wallets"
  | "settings"
  | "add"
  | "more";

type DesktopNavItem = {
  key: AppNavKey;
  label: string;
  path: string;
  icon: LucideIcon;
};

type MobileDockItem = DesktopNavItem & {
  primary: boolean;
  activeWhen: AppNavKey[];
};

export const desktopNavMainItems: DesktopNavItem[] = [
  { key: "dashboard", label: "Dashboard", path: "/", icon: Home },
  { key: "transactions", label: "Transactions", path: "/transactions", icon: ReceiptText },
  { key: "reports", label: "Reports", path: "/reports", icon: BarChart3 },
  { key: "budgets", label: "Budgets", path: "/budgets", icon: Target },
  { key: "categories", label: "Categories", path: "/categories", icon: Tags },
  { key: "wallets", label: "Wallets", path: "/wallets", icon: Wallet },
];

export const desktopNavBottomItems: DesktopNavItem[] = [
  { key: "settings", label: "Settings", path: "/settings", icon: Settings },
];

export const mobileDockItems: MobileDockItem[] = [
  {
    key: "dashboard",
    label: "Home",
    path: "/",
    icon: Home,
    primary: false,
    activeWhen: ["dashboard"],
  },
  {
    key: "transactions",
    label: "Transaksi",
    path: "/transactions",
    icon: ReceiptText,
    primary: false,
    activeWhen: ["transactions"],
  },
  {
    key: "add",
    label: "Add",
    path: "/transactions/new",
    icon: PlusCircle,
    primary: true,
    activeWhen: ["add"],
  },
  {
    key: "reports",
    label: "Laporan",
    path: "/reports",
    icon: BarChart3,
    primary: false,
    activeWhen: ["reports"],
  },
  {
    key: "more",
    label: "More",
    path: "/more",
    icon: Ellipsis,
    primary: false,
    activeWhen: ["more", "settings", "budgets", "categories", "wallets"],
  },
];

export function withMonth(path: string, month?: string) {
  if (!month) return path;
  if (path === "/" || path === "/transactions" || path === "/reports" || path === "/budgets") {
    return `${path}?month=${encodeURIComponent(month)}`;
  }
  return path;
}

export function getActiveNavFromPathname(pathname: string | null) {
  if (!pathname) return null;
  if (pathname === "/") return "dashboard";
  if (pathname === "/transactions/new") return "add";
  if (pathname.startsWith("/transactions")) return "transactions";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/budgets")) return "budgets";
  if (pathname.startsWith("/categories")) return "categories";
  if (pathname.startsWith("/wallets")) return "wallets";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/more")) return "more";
  return null;
}

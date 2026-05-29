import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Home,
  Ellipsis,
  PlusCircle,
  ReceiptText,
  Settings,
  Tags,
  Target,
} from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

export type AppNavKey =
  | "dashboard"
  | "transactions"
  | "reports"
  | "budgets"
  | "categories"
  | "settings"
  | "add"
  | "more";

type AppShellProps = {
  title: string;
  description: string;
  activeNav: AppNavKey;
  month?: string;
  badge?: string;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  headerLayout?: "split" | "stacked";
  headerActions?: ReactNode;
  headerActionsClassName?: string;
  mobileActions?: ReactNode;
  showMobileDock?: boolean;
  children: ReactNode;
};

function withMonth(path: string, month?: string) {
  if (!month) return path;
  if (path === "/" || path === "/transactions" || path === "/reports" || path === "/budgets") {
    return `${path}?month=${encodeURIComponent(month)}`;
  }
  return path;
}

export default function AppShell({
  title,
  description,
  activeNav,
  month,
  badge = "Finance Journal",
  className = "",
  containerClassName = "",
  contentClassName = "",
  titleClassName = "",
  headerLayout = "split",
  headerActions,
  headerActionsClassName = "",
  mobileActions,
  showMobileDock = true,
  children,
}: AppShellProps) {
  const navMainItems = [
    {
      key: "dashboard" as const,
      label: "Dashboard",
      href: withMonth("/", month),
      icon: Home,
    },
    {
      key: "transactions" as const,
      label: "Transactions",
      href: withMonth("/transactions", month),
      icon: ReceiptText,
    },
    {
      key: "reports" as const,
      label: "Reports",
      href: withMonth("/reports", month),
      icon: BarChart3,
    },
    {
      key: "budgets" as const,
      label: "Budgets",
      href: withMonth("/budgets", month),
      icon: Target,
    },
    {
      key: "categories" as const,
      label: "Categories",
      href: "/categories",
      icon: Tags,
    },
  ];

  const navBottomItems = [
    {
      key: "settings" as const,
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const mobileDockItems = [
    {
      key: "dashboard" as const,
      label: "Home",
      href: withMonth("/", month),
      icon: Home,
      primary: false,
      activeWhen: ["dashboard"] as AppNavKey[],
    },
    {
      key: "transactions" as const,
      label: "Transaksi",
      href: withMonth("/transactions", month),
      icon: ReceiptText,
      primary: false,
      activeWhen: ["transactions"] as AppNavKey[],
    },
    {
      key: "add" as const,
      label: "Add",
      href: "/transactions/new",
      icon: PlusCircle,
      primary: true,
      activeWhen: ["add"] as AppNavKey[],
    },
    {
      key: "reports" as const,
      label: "Laporan",
      href: withMonth("/reports", month),
      icon: BarChart3,
      primary: false,
      activeWhen: ["reports"] as AppNavKey[],
    },
    {
      key: "more" as const,
      label: "More",
      href: "/more",
      icon: Ellipsis,
      primary: false,
      activeWhen: ["more", "settings", "budgets", "categories"] as AppNavKey[],
    },
  ];

  const shellPageClass = showMobileDock
    ? "page-shell app-shell-page"
    : "page-shell app-shell-page app-shell-page--no-dock";

  return (
    <main className={`${shellPageClass} ${className}`}>
      <div className={`page-container app-shell-grid ${containerClassName}`}>
        <aside className="app-shell-sidebar section-card hidden lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {badge}
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Finance Tracker</p>
          </div>

          <nav aria-label="Navigasi utama" className="mt-6 space-y-2">
            {navMainItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeNav;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`app-shell-nav-link ${isActive ? "is-active" : ""}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pt-6">
            <div className="h-px bg-[color:var(--stroke)]" />
            {navBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeNav;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`app-shell-nav-link ${isActive ? "is-active" : ""}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <ThemeToggleButton
              className="btn-secondary mt-2 w-full justify-center gap-2"
              showLabel
            />
            <LogoutButton className="btn-secondary mt-2 w-full justify-center gap-2" />
          </div>
        </aside>

        <div className={`min-w-0 ${contentClassName}`}>
          <section className="hero-panel">
            <div
              className={`flex flex-col gap-4 ${
                headerLayout === "stacked"
                  ? "lg:items-start"
                  : "lg:flex-row lg:items-end lg:justify-between"
              }`}
            >
              <div className="min-w-0 lg:min-w-[240px] lg:flex-1 lg:pr-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {badge}
                </p>
                <h1 className={`mt-2 text-3xl font-bold md:text-4xl ${titleClassName}`}>{title}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
              </div>

              {headerActions ? (
                <div
                  className={`hidden lg:flex lg:items-end lg:gap-2 ${
                    headerLayout === "stacked"
                      ? "lg:w-full lg:justify-end"
                      : "lg:shrink-0 lg:justify-end"
                  } ${headerActionsClassName}`}
                >
                  {headerActions}
                </div>
              ) : null}
            </div>

            {mobileActions ? <div className="mt-5 grid gap-3 lg:hidden">{mobileActions}</div> : null}
          </section>

          <section className="mt-6">{children}</section>
        </div>
      </div>

      {showMobileDock ? (
        <nav className="app-shell-mobile-dock lg:hidden" aria-label="Navigasi cepat">
          {mobileDockItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activeWhen.includes(activeNav);

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`app-shell-dock-link ${item.primary ? "is-primary" : ""} ${isActive ? "is-active" : ""}`}
              >
                <Icon size={item.primary ? 18 : 16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </main>
  );
}

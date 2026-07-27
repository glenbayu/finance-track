import Link from "next/link";
import type { ReactNode } from "react";
import { mobileDockItems, type AppNavKey, withMonth } from "@/components/layout/app-nav";

type AppShellProps = {
  title: string;
  description: string;
  activeNav: AppNavKey | null;
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
  children: ReactNode;
  layoutStyle?: "default" | "drawer";
  backPath?: string;
};

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
  children,
  layoutStyle = "default",
  backPath,
}: AppShellProps) {
  if (layoutStyle === "drawer") {
    return (
      <>
        {/* Backdrop untuk mobile screen (klik untuk kembali) */}
        <Link 
          href={backPath || "/"}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-fade-in lg:hidden cursor-default"
          aria-hidden="true"
        />

        {/* Desktop: standard container flow; Mobile: fixed iOS-style bottom sheet */}
        <div className={`min-w-0 w-full lg:animate-fade-in-up ${className} ${containerClassName} max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-50 max-lg:rounded-t-[32px] max-lg:bg-[color:var(--surface)] max-lg:p-6 max-lg:pb-12 max-lg:max-h-[85dvh] max-lg:overflow-y-auto max-lg:animate-slide-up-drawer max-lg:border-t max-lg:border-[color:var(--stroke)] max-lg:shadow-[0_-10px_40px_rgba(0,0,0,0.35)]`}>
          
          {/* iOS drag handle bar on mobile */}
          <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-slate-300 dark:bg-slate-700 lg:hidden" />
          
          <div className={`min-w-0 ${contentClassName}`}>
            {/* Header: stacked on mobile, inline on desktop */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between max-lg:mb-4">
              <div className="space-y-1.5 md:space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80 dark:text-slate-400/80 md:text-sm animate-[metric-enter_0.4s_both]">
                  {badge}
                </p>
                <h1 className={`text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl animate-[metric-enter_0.4s_both_0.03s] ${titleClassName}`}>
                  {title}
                </h1>
                {description ? (
                  <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 md:text-lg">
                    {description}
                  </p>
                ) : null}
              </div>

              {headerActions ? (
                <div className="hidden lg:flex lg:items-end lg:gap-2 lg:shrink-0 lg:justify-end">
                  {headerActions}
                </div>
              ) : null}
            </div>

            <section className="lg:mt-6">{children}</section>
          </div>
        </div>

        {/* Mobile bottom dock in the background */}
        <nav className="app-shell-mobile-dock lg:hidden" aria-label="Navigasi cepat">
          {mobileDockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav ? item.activeWhen.includes(activeNav) : false;

            return (
              <Link
                key={item.key}
                href={withMonth(item.path, month)}
                aria-current={isActive ? "page" : undefined}
                className={`app-shell-dock-link ${item.primary ? "is-primary" : ""} ${isActive ? "is-active" : ""}`}
              >
                <Icon size={item.primary ? 18 : 16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </>
    );
  }

  return (
    <>
      <div className={`min-w-0 w-full animate-fade-in-up ${className} ${containerClassName}`}>
        <div className={`min-w-0 ${contentClassName}`}>
          <section className="hero-panel">
            <div
              className={`flex flex-col gap-4 ${
                headerLayout === "stacked"
                  ? "lg:items-start"
                  : "lg:flex-row lg:items-end lg:justify-between"
              }`}
            >
              <div className="space-y-1.5 md:space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80 dark:text-slate-400/80 md:text-sm animate-[metric-enter_0.4s_both]">
                  {badge}
                </p>
                <h1
                  className={`text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl animate-[metric-enter_0.4s_both_0.03s] ${titleClassName}`}
                >
                  {title}
                </h1>
                {description ? (
                  <p className="max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 md:block md:text-lg">
                    {description}
                  </p>
                ) : null}
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

            {mobileActions ? (
              <div className="mt-5 grid gap-3 overflow-x-hidden lg:hidden">{mobileActions}</div>
            ) : null}
          </section>

          <section className="mt-6">{children}</section>
        </div>
      </div>

      <nav className="app-shell-mobile-dock lg:hidden" aria-label="Navigasi cepat">
        {mobileDockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav ? item.activeWhen.includes(activeNav) : false;

          return (
            <Link
              key={item.key}
              href={withMonth(item.path, month)}
              aria-current={isActive ? "page" : undefined}
              className={`app-shell-dock-link ${item.primary ? "is-primary" : ""} ${isActive ? "is-active" : ""}`}
            >
              <Icon size={item.primary ? 18 : 16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

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
  const MobileNav = (
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
  );

  if (layoutStyle === "drawer") {
    return (
      <>
        <Link
          href={backPath || "/"}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-fade-in lg:hidden cursor-default"
          aria-hidden="true"
        />
        <div className={`min-w-0 w-full lg:animate-fade-in-up ${className} ${containerClassName} max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-50 max-lg:rounded-t-[28px] max-lg:p-6 max-lg:pb-12 max-lg:max-h-[85dvh] max-lg:overflow-y-auto max-lg:animate-slide-up-drawer max-lg:border-t max-lg:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]`}
          style={{ backgroundColor: "var(--lk-surface)", borderColor: "var(--lk-border)" }}
        >
          <div className="mx-auto mb-4 h-1 w-14 rounded-full lg:hidden" style={{ backgroundColor: "var(--lk-border-strong)" }} />
          <div className={`min-w-0 ${contentClassName}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between max-lg:mb-4">
              <div>
                <h1 className={`text-lg font-bold ${titleClassName}`} style={{ color: "var(--lk-text)" }}>
                  {title}
                </h1>
                {description && (
                  <p className="text-sm mt-0.5" style={{ color: "var(--lk-text-muted)" }}>{description}</p>
                )}
              </div>
              {headerActions && (
                <div className="hidden lg:flex lg:items-center lg:gap-2 lg:shrink-0">
                  {headerActions}
                </div>
              )}
            </div>
            <section className="lg:mt-4">{children}</section>
          </div>
        </div>
        {MobileNav}
      </>
    );
  }

  return (
    <>
      <div className={`min-w-0 w-full animate-fade-in-up ${className} ${containerClassName}`}>
        <div className={`min-w-0 ${contentClassName}`}>

          {/* Slim Page Header */}
          <div
            className="sticky top-0 z-30 flex items-center justify-between gap-4"
            style={{
              padding: "0.875rem 1.5rem",
              borderBottom: "1px solid var(--lk-border)",
              backgroundColor: "var(--lk-bg)",
            }}
          >
            <div className="min-w-0">
              <h1
                className={`text-base font-bold leading-tight truncate ${titleClassName}`}
                style={{ color: "var(--lk-text)" }}
              >
                {title}
              </h1>
              {description && (
                <p className="text-xs mt-0.5 truncate hidden sm:block" style={{ color: "var(--lk-text-muted)" }}>
                  {description}
                </p>
              )}
            </div>

            {headerActions && (
              <div className={`hidden lg:flex lg:items-center lg:gap-2 lg:shrink-0 ${headerActionsClassName}`}>
                {headerActions}
              </div>
            )}
          </div>

          {/* Mobile Actions (filter row on mobile) */}
          {mobileActions && (
            <div className="p-3 lg:hidden" style={{ borderBottom: "1px solid var(--lk-border)" }}>
              {mobileActions}
            </div>
          )}

          {/* Page Content */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>

      {MobileNav}
    </>
  );
}


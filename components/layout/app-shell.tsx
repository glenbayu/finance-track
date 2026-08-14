import Link from "next/link";
import type { ReactNode } from "react";
import { mobileDockItems, type AppNavKey, withMonth } from "@/components/layout/app-nav";

type AppShellProps = {
  title: string;
  description: string;
  activeNav: AppNavKey | null;
  month?: string;
  badge?: string;
  eyebrow?: string;
  heroIcon?: ReactNode;
  heroStats?: ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  /** Controls layout of hero. "stacked" places actions below title */
  headerLayout?: "standard" | "stacked";
  /** Optional actions to place directly to the right of the title (useful in stacked layout) */
  titleActions?: ReactNode;
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
  eyebrow,
  heroIcon,
  heroStats,
  className = "",
  containerClassName = "",
  contentClassName = "",
  titleClassName = "",
  headerLayout = "standard",
  titleActions,
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
        <div className={`min-w-0 w-full lg:animate-fade-in-up ${className} ${containerClassName} max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-50 max-lg:rounded-t-[20px] max-lg:p-6 max-lg:pb-12 max-lg:max-h-[85dvh] max-lg:overflow-y-auto max-lg:animate-slide-up-drawer max-lg:border-t max-lg:shadow-[0_-4px_24px_rgba(0,0,0,0.1)] dark:max-lg:shadow-none`}
          style={{ backgroundColor: "var(--lk-surface)", borderColor: "var(--lk-border)" }}
        >
          <div className="mx-auto mb-4 h-1 w-12 rounded-full lg:hidden" style={{ backgroundColor: "var(--lk-border-strong)" }} />
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

          {/* Floating Sticky Header Wrapper */}
          <div className="sticky top-0 z-30 px-3 pt-3 pb-0 sm:px-4 sm:pt-4 lg:px-6 lg:pt-5">
            <header className={`app-hero app-hero--${headerLayout}`}
              style={{ position: "relative", top: "auto", zIndex: "auto", margin: 0, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
              <div className="app-hero__main flex-1 w-full flex items-start justify-between">
                <div className="flex items-center gap-[0.85rem] min-w-0">
                  {heroIcon ? <div className="app-hero__icon" aria-hidden="true">{heroIcon}</div> : null}
                  <div className="min-w-0">
                    <div className="app-hero__eyebrow">{eyebrow || badge}</div>
                    <h1 className={`app-hero__title ${titleClassName}`}>
                      {title}
                    </h1>
                    {description && <p className="app-hero__description">{description}</p>}
                  </div>
                </div>
                
                {titleActions && (
                  <div className="hidden shrink-0 items-center gap-3 lg:flex mt-1">
                    {titleActions}
                  </div>
                )}
              </div>

              {(heroStats || headerActions) && (
                <div className={`app-hero__aside ${headerActionsClassName}`}>
                  {heroStats ? <div className="app-hero__stats">{heroStats}</div> : null}
                  {headerActions ? <div className="app-hero__actions">{headerActions}</div> : null}
                </div>
              )}
            </header>
          </div>

          {/* Mobile Actions (filter row on mobile) */}
          {mobileActions && (
            <div className="px-4 pt-2 lg:hidden">
              {mobileActions}
            </div>
          )}

          {/* Page Content */}
          <div className="p-4 pt-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>

      {MobileNav}
    </>
  );
}


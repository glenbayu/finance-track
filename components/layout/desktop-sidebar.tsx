import LogoutButton from "@/components/auth/logout-button";
import DesktopSidebarLinks from "@/components/layout/desktop-sidebar-links";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

export default function DesktopSidebar() {
  return (
    <aside className="section-card hidden self-start lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:overflow-auto">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Finance Journal
        </p>
        <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">Finance Tracker</p>
      </div>

      <nav aria-label="Navigasi utama" className="mt-6 space-y-2">
        <DesktopSidebarLinks section="main" />
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <div className="h-px bg-[color:var(--stroke)]" />
        <DesktopSidebarLinks section="bottom" />
        <ThemeToggleButton className="btn-secondary mt-2 w-full justify-center gap-2" showLabel />
        <LogoutButton className="btn-secondary mt-2 w-full justify-center gap-2" />
      </div>
    </aside>
  );
}

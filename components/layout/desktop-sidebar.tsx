import { BookOpen } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import DesktopSidebarLinks from "@/components/layout/desktop-sidebar-links";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function getUserInfo() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : email.slice(0, 2).toUpperCase();
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white select-none"
      style={{ backgroundColor: "var(--lk-primary)" }}
    >
      {initials}
    </div>
  );
}

async function UserProfileSection() {
  const user = await getUserInfo();
  if (!user) return null;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";
  const email = user.email || "";
  return (
    <div
      className="mx-2 mb-2 rounded-xl p-3"
      style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}
    >
      <div className="flex items-center gap-2.5">
        <UserAvatar name={displayName} email={email} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold" style={{ color: "var(--lk-text)" }}>
            {displayName}
          </p>
          <p className="truncate text-[10px]" style={{ color: "var(--lk-text-muted)" }}>
            {email}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DesktopSidebar() {
  return (
    <aside
      className="hidden lg:flex lg:flex-col glass-panel shadow-sm transition-all duration-300"
      style={{
        position: "fixed",
        top: "1rem",
        left: "1rem",
        bottom: "1rem",
        width: "240px",
        borderRadius: "1rem",
        zIndex: 40,
        overflowY: "auto",
        borderRight: "none",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "1.25rem 1rem 0.875rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: "1.875rem",
              height: "1.875rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--lk-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={13} color="white" />
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--lk-text-muted)", lineHeight: 1 }}>
              Finance
            </p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--lk-text)", lineHeight: 1.2, marginTop: "2px" }}>
              Journal
            </p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav aria-label="Navigasi utama" style={{ padding: "0.625rem 0.625rem", flex: 1 }}>
        <Suspense fallback={<div className="h-40 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md m-2" />}>
          <DesktopSidebarLinks section="main" />
        </Suspense>
      </nav>

      {/* Bottom area */}
      <div style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--lk-border)", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
        <Suspense fallback={<div className="h-10 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md mx-3" />}>
          <DesktopSidebarLinks section="bottom" />
        </Suspense>
        <ThemeToggleButton className="app-shell-nav-link" showLabel />
        <LogoutButton className="app-shell-nav-link" />

        {/* User Profile Card */}
        <div className="mt-2" style={{ borderTop: "1px solid var(--lk-border)", paddingTop: "0.5rem" }}>
          <Suspense
            fallback={
              <div className="mx-2 mb-2 flex items-center gap-2.5 rounded-xl p-3" style={{ backgroundColor: "var(--lk-bg)" }}>
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            }
          >
            <UserProfileSection />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}

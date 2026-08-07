import Link from "next/link";
import { BookOpen } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import DesktopSidebarLinks from "@/components/layout/desktop-sidebar-links";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

export default function DesktopSidebar() {
  return (
    <aside
      className="hidden lg:flex lg:flex-col"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "220px",
        backgroundColor: "var(--lk-surface)",
        borderRight: "1px solid var(--lk-border)",
        zIndex: 40,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem 0.875rem",
          borderBottom: "1px solid var(--lk-border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: "1.875rem",
              height: "1.875rem",
              borderRadius: "0.375rem",
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
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--lk-text-muted)",
                lineHeight: 1,
              }}
            >
              Finance
            </p>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--lk-text)",
                lineHeight: 1.2,
                marginTop: "2px",
              }}
            >
              Journal
            </p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav
        aria-label="Navigasi utama"
        style={{ padding: "0.625rem 0.625rem", flex: 1 }}
      >
        <DesktopSidebarLinks section="main" />
      </nav>

      {/* Bottom area */}
      <div
        style={{
          padding: "0.625rem",
          borderTop: "1px solid var(--lk-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.125rem",
        }}
      >
        <DesktopSidebarLinks section="bottom" />
        <ThemeToggleButton
          className="app-shell-nav-link w-full"
          showLabel
        />
        <LogoutButton className="app-shell-nav-link w-full" />
      </div>
    </aside>
  );
}


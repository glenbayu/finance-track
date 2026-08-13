import type { ReactNode } from "react";
import DesktopSidebar from "@/components/layout/desktop-sidebar";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {

  return (
    <div style={{ display: "flex", minHeight: "100dvh", backgroundColor: "var(--lk-bg)" }}>
      <DesktopSidebar />
      {/* Main content area — offset by sidebar width on desktop */}
      <main
        className="app-shell-page w-full min-w-0"
        style={{
          paddingLeft: 0,
          /* On lg screens, offset content by sidebar width */
        }}
      >
        <div className="lg:pl-[272px] min-h-full">
          {children}
        </div>
      </main>
      <MobileBottomNav className="lg:hidden" />
    </div>
  );
}


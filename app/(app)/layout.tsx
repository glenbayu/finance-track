import { Suspense } from "react";
import type { ReactNode } from "react";
import DesktopSidebar from "@/components/layout/desktop-sidebar";
import RouteProgress from "@/components/ui/route-progress";
import { TransactionListMemory } from "@/components/transactions/transaction-list-context";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {

  return (
    <div style={{ display: "flex", minHeight: "100dvh", backgroundColor: "var(--lk-bg)" }}>
      {/* Route progress bar — shows on internal navigation */}
      <Suspense fallback={null}>
        <RouteProgress />
        <TransactionListMemory />
      </Suspense>
      <DesktopSidebar />
      {/* Main content area — offset by sidebar width on desktop */}
      <main
        className="app-shell-page w-full min-w-0"
        style={{
          paddingLeft: 0,
          /* On lg screens, offset content by sidebar width */
        }}
      >
        <div className="lg:pl-[256px] min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

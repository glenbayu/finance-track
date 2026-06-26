import type { ReactNode } from "react";
import DesktopSidebar from "@/components/layout/desktop-sidebar";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell app-shell-page">
      <div className="page-container grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <DesktopSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}

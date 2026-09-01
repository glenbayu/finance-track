import AppShell from "@/components/layout/app-shell";
import { LayoutDashboard } from "lucide-react";

export default function DashboardLoading() {
  return (
    <AppShell
      className="journal-dashboard"
      activeNav="dashboard"
      eyebrow="Ringkasan Bulanan"
      heroIcon={<LayoutDashboard size={19} strokeWidth={2.2} />}
      title="Memuat Dashboard..."
      description="Menyiapkan data arus kas dan pola pengeluaran bulananmu..."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <>
          <div className="h-10 w-[170px] rounded-full animate-shimmer" />
          <div className="h-10 w-28 rounded-lg animate-shimmer" />
        </>
      }
      mobileActions={
        <div className="flex flex-col gap-3">
          <div className="flex w-full items-center gap-2">
            <div className="h-10 flex-1 rounded-full animate-shimmer" />
            <div className="h-10 w-10 shrink-0 rounded-lg animate-shimmer" />
          </div>
          <div className="h-14 w-full rounded-2xl animate-shimmer" />
        </div>
      }
    >
      {/* Mobile & Tablet Skeleton Layout */}
      <div className="lg:hidden space-y-6">
        {/* Top 2 Stat Cards */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Sisa Saldo Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-20 rounded animate-shimmer" />
              <div className="h-7 w-7 rounded-md animate-shimmer" />
            </div>
            <div className="h-8 w-44 rounded-lg animate-shimmer" />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/60">
              <div className="space-y-1">
                <div className="h-3 w-10 rounded animate-shimmer" />
                <div className="h-4 w-16 rounded animate-shimmer" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-16 rounded animate-shimmer" />
                <div className="h-4 w-16 rounded animate-shimmer" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-12 rounded animate-shimmer" />
                <div className="h-4 w-16 rounded animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Pemasukan Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-24 rounded animate-shimmer" />
              <div className="h-7 w-7 rounded-md animate-shimmer" />
            </div>
            <div className="h-8 w-40 rounded-lg animate-shimmer" />
          </div>
        </section>

        {/* Charts & Insights */}
        <section className="grid gap-6">
          {/* Donut chart card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="h-5 w-44 rounded animate-shimmer mb-6" />
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-around">
              <div className="h-40 w-40 rounded-full animate-shimmer" />
              <div className="w-full space-y-3 sm:w-1/2">
                <div className="h-4 w-full rounded animate-shimmer" />
                <div className="h-4 w-3/4 rounded animate-shimmer" />
                <div className="h-4 w-5/6 rounded animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Top Spending insight */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="h-5 w-48 rounded animate-shimmer mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg animate-shimmer" />
                    <div className="h-4 w-28 rounded animate-shimmer" />
                  </div>
                  <div className="h-4 w-20 rounded animate-shimmer" />
                </div>
              ))}
            </div>
          </div>

          {/* Trend chart */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="h-5 w-48 rounded animate-shimmer mb-4" />
            <div className="h-48 w-full rounded-xl animate-shimmer" />
          </div>
        </section>
      </div>

      {/* Desktop Bento Grid Skeleton Layout */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 mt-6 items-start">
        {/* Main Content Column (Left 3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Top Row: Balance & Income */}
          <div className="grid grid-cols-3 gap-4">
            {/* Tile 1: Main Balance */}
            <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-4 w-36 rounded animate-shimmer" />
                  <div className="h-8 w-8 rounded-lg animate-shimmer" />
                </div>
                <div className="h-10 w-56 rounded-lg animate-shimmer" />
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800/60">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded animate-shimmer" />
                  <div className="h-4 w-24 rounded animate-shimmer" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded animate-shimmer" />
                  <div className="h-4 w-24 rounded animate-shimmer" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded animate-shimmer" />
                  <div className="h-4 w-24 rounded animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Tile 2: Pemasukan */}
            <div className="col-span-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-4 w-24 rounded animate-shimmer" />
                  <div className="h-8 w-8 rounded-lg animate-shimmer" />
                </div>
                <div className="h-10 w-36 rounded-lg animate-shimmer" />
              </div>
              <div className="h-12 w-full rounded-xl animate-shimmer mt-6" />
            </div>
          </div>

          {/* Row 2: Charts & Top Spending */}
          <div className="grid grid-cols-2 gap-4">
            {/* Donut Chart */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="h-5 w-44 rounded animate-shimmer mb-6" />
              <div className="flex items-center justify-center gap-6">
                <div className="h-40 w-40 rounded-full animate-shimmer shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-full rounded animate-shimmer" />
                  <div className="h-4 w-4/5 rounded animate-shimmer" />
                  <div className="h-4 w-3/4 rounded animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Top Spending Insight */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="h-5 w-48 rounded animate-shimmer mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl animate-shimmer" />
                      <div className="space-y-1">
                        <div className="h-4 w-28 rounded animate-shimmer" />
                        <div className="h-3 w-16 rounded animate-shimmer" />
                      </div>
                    </div>
                    <div className="h-4 w-24 rounded animate-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Monthly Trend */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <div className="h-5 w-52 rounded animate-shimmer mb-4" />
            <div className="h-48 w-full rounded-xl animate-shimmer" />
          </div>
        </div>

        {/* Right Sidebar Column (1 col): Monthly History */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 rounded animate-shimmer" />
            <div className="h-3 w-16 rounded animate-shimmer" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded animate-shimmer" />
                  <div className="h-3 w-12 rounded animate-shimmer" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="h-3 w-14 rounded animate-shimmer" />
                  <div className="h-4 w-20 rounded animate-shimmer" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-14 rounded animate-shimmer" />
                  <div className="h-4 w-20 rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import AppShell from "@/components/layout/app-shell";
import { BarChart3 } from "lucide-react";

export default function ReportsLoading() {
  return (
    <AppShell
      className="journal-dashboard"
      activeNav="reports"
      eyebrow="Insight Keuangan"
      heroIcon={<BarChart3 size={19} strokeWidth={2.2} />}
      title="Laporan & Analisis"
      description="Lihat rekap bulanan, tren pengeluaran, dan estimasi bulan berikutnya berdasarkan data transaksi kamu."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <div className="h-10 w-[170px] rounded-full animate-shimmer" />
      }
      mobileActions={
        <div className="h-10 w-full rounded-full animate-shimmer" />
      }
    >
      {/* Top 4 Summary Cards */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900 grid sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/60">
        {[1, 2, 3, 4].map((i) => (
          <article key={i} className="p-5 space-y-2">
            <div className="h-3.5 w-28 rounded animate-shimmer" />
            <div className="h-7 w-36 rounded-lg animate-shimmer" />
          </article>
        ))}
      </section>

      {/* Recap Section Card */}
      <section className="section-card mt-6">
        <div className="space-y-1 mb-4">
          <div className="h-6 w-48 rounded-lg animate-shimmer" />
          <div className="h-4 w-72 rounded animate-shimmer" />
        </div>

        {/* 3 Metric Tiles */}
        <div className="overflow-hidden rounded-lg shadow-sm grid md:grid-cols-2 xl:grid-cols-3 border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/60">
          {[1, 2, 3].map((i) => (
            <article key={i} className="p-4 space-y-2">
              <div className="h-3 w-40 rounded animate-shimmer" />
              <div className="h-6 w-32 rounded-lg animate-shimmer" />
              <div className="h-3 w-24 rounded animate-shimmer" />
            </article>
          ))}
        </div>
      </section>

      {/* Dynamic Charts Card */}
      <section className="section-card mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="h-5 w-44 rounded animate-shimmer" />
            <div className="h-3.5 w-64 rounded animate-shimmer" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-lg animate-shimmer" />
            <div className="h-8 w-24 rounded-lg animate-shimmer" />
          </div>
        </div>
        <div className="h-64 w-full rounded-xl animate-shimmer" />
      </section>

      {/* Forecast Section */}
      <section className="section-card mt-6 space-y-4">
        <div className="space-y-1">
          <div className="h-5 w-48 rounded animate-shimmer" />
          <div className="h-3.5 w-72 rounded animate-shimmer" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-2">
            <div className="h-3 w-32 rounded animate-shimmer" />
            <div className="h-7 w-40 rounded-lg animate-shimmer" />
          </div>
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-2 md:col-span-2">
            <div className="h-3 w-40 rounded animate-shimmer" />
            <div className="h-4 w-full rounded animate-shimmer" />
            <div className="h-4 w-3/4 rounded animate-shimmer" />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

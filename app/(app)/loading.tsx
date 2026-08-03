import AppShell from "@/components/layout/app-shell";

export default function Loading() {
  return (
    <AppShell
      className="journal-dashboard"
      activeNav={null}
      title="Memuat Halaman"
      description="Menyiapkan data keuangan terbarumu..."
      titleClassName="opacity-70 animate-pulse"
    >
      <div className="space-y-6">
        
        {/* Skeleton Top Cards */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex h-[110px] w-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-20 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </section>

        {/* Skeleton Main Section (List/Chart Placeholder) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/60">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/5 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-6 w-20 shrink-0 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}

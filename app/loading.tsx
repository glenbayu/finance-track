import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <main className="page-shell journal-auth">
      <div className="page-container max-w-xl">
        <section className="hero-panel">
          <div className="space-y-5">
            <div className="route-loading-bar" aria-hidden="true" />

            <div className="flex min-h-[32vh] flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)]/90 p-4 shadow-[0_18px_32px_-24px_rgba(38,30,13,0.32)]">
                <LoadingSpinner size="lg" className="text-slate-700 dark:text-slate-200" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Memuat Aplikasi
                </p>
                <p className="mx-auto max-w-xl text-sm text-slate-500 dark:text-slate-400">
                  Tunggu sebentar, kami sedang menyiapkan halaman yang kamu buka.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <div className="route-loading-block h-9 w-28 rounded-full" />
                <div className="route-loading-block route-loading-delay-1 h-9 w-36 rounded-full" />
                <div className="route-loading-block route-loading-delay-2 h-9 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

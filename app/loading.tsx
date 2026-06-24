import AppShell from "@/components/layout/app-shell";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <AppShell
      className="journal-dashboard"
      activeNav={null}
      title="Memuat Halaman"
      description="Menyiapkan konten terbaru untuk halaman yang kamu buka."
      titleClassName="opacity-90"
    >
      <div className="space-y-5">
        <div className="route-loading-bar" aria-hidden="true" />

        <section className="section-card min-h-[40vh]">
          <div className="flex min-h-[32vh] flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)]/90 p-4 shadow-[0_18px_32px_-24px_rgba(38,30,13,0.32)]">
              <LoadingSpinner size="lg" className="text-slate-700 dark:text-slate-200" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Memuat Konten
              </p>
              <p className="mx-auto max-w-xl text-sm text-slate-500 dark:text-slate-400">
                Tunggu sebentar, kami sedang mengambil data dan merapikan tampilan halaman ini.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <div className="route-loading-block h-9 w-28 rounded-full" />
              <div className="route-loading-block route-loading-delay-1 h-9 w-36 rounded-full" />
              <div className="route-loading-block route-loading-delay-2 h-9 w-24 rounded-full" />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const safeMessage =
    process.env.NODE_ENV === "development" && error.message
      ? error.message
      : "Terjadi kendala saat memproses permintaan kamu.";

  return (
    <main className="page-shell journal-auth">
      <div className="page-container max-w-xl">
        <section className="hero-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400">
            Finance Journal
          </p>
          <h1 className="mt-2 text-2xl font-bold">Terjadi error</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Aksi kamu gagal diproses. Coba ulangi, atau refresh halaman.
          </p>

          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {safeMessage}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn-primary" onClick={reset}>
              Coba lagi
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              Refresh halaman
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";
import Link from "next/link";

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

          <div role="alert" className="mt-5 ui-alert ui-alert--error">
            {safeMessage}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/transactions" className="btn-secondary">Lihat transaksi</Link>
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

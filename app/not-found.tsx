import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="page-container max-w-xl">
        <section className="hero-panel">
          <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Link-nya mungkin salah, atau data yang kamu cari sudah dihapus.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/" className="btn-primary">
              Ke Dashboard
            </Link>
            <Link href="/transactions" className="btn-secondary">
              Lihat Transaksi
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

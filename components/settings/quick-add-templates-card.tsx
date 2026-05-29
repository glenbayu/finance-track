import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function QuickAddTemplatesCard() {
  return (
    <article className="section-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <Sparkles size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Quick Add Templates</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Buat template transaksi yang sering kamu pakai agar input jadi lebih cepat.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/settings/templates" className="btn-secondary h-10 px-4">
          Kelola Template
        </Link>
      </div>
    </article>
  );
}

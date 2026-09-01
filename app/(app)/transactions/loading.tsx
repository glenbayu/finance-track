import AppShell from "@/components/layout/app-shell";
import { ReceiptText } from "lucide-react";

export default function TransactionsLoading() {
  return (
    <AppShell
      className="transactions-page journal-transactions"
      activeNav="transactions"
      eyebrow="Aktivitas Keuangan"
      heroIcon={<ReceiptText size={19} strokeWidth={2.2} />}
      title="Daftar Transaksi"
      description="Semua pemasukan dan pengeluaran pada bulan terpilih."
      headerActionsClassName="hidden lg:flex lg:flex-1 lg:justify-end lg:pl-6"
      headerActions={
        <div className="flex w-full max-w-[560px] flex-col gap-2">
          {/* Top Row: Date & Search */}
          <div className="flex w-full gap-2">
            <div className="h-10 w-[175px] rounded-full animate-shimmer shrink-0" />
            <div className="h-10 w-full rounded-xl animate-shimmer flex-1" />
          </div>
          {/* Bottom Row: Filters & Add button */}
          <div className="flex w-full gap-2 items-center">
            <div className="grid grid-cols-3 gap-2 flex-1">
              <div className="h-9 rounded-lg animate-shimmer" />
              <div className="h-9 rounded-lg animate-shimmer" />
              <div className="h-9 rounded-lg animate-shimmer" />
            </div>
            <div className="h-9 w-36 rounded-lg animate-shimmer shrink-0" />
          </div>
        </div>
      }
      mobileActions={
        <div className="flex flex-col gap-3">
          <div className="h-10 w-full rounded-xl animate-shimmer" />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 space-y-4">
            {/* Income Expense Summary Skeleton */}
            <div className="flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/40 divide-x divide-slate-200/60 dark:divide-slate-700/60 p-0 overflow-hidden">
              <div className="flex-1 text-center py-4 px-2 space-y-1">
                <div className="h-3 w-12 rounded animate-shimmer mx-auto" />
                <div className="h-5 w-24 rounded animate-shimmer mx-auto" />
              </div>
              <div className="flex-1 text-center py-4 px-2 space-y-1">
                <div className="h-3 w-12 rounded animate-shimmer mx-auto" />
                <div className="h-5 w-24 rounded animate-shimmer mx-auto" />
              </div>
            </div>
            {/* Month Scroll Pill */}
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-14 rounded-full animate-shimmer shrink-0" />
              ))}
            </div>
            {/* Filter 3 cols */}
            <div className="grid grid-cols-3 gap-2">
              <div className="h-9 rounded-lg animate-shimmer" />
              <div className="h-9 rounded-lg animate-shimmer" />
              <div className="h-9 rounded-lg animate-shimmer" />
            </div>
          </div>
        </div>
      }
    >
      <section className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 overflow-hidden">
        {/* Mobile List Skeleton */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-xl animate-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 rounded animate-shimmer" />
                  <div className="h-3 w-40 rounded animate-shimmer" />
                </div>
              </div>
              <div className="space-y-1 text-right shrink-0">
                <div className="h-4 w-20 rounded animate-shimmer ml-auto" />
                <div className="h-2.5 w-12 rounded animate-shimmer ml-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full caption-bottom text-sm border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-800/40">
              <tr>
                <th className="h-12 px-4 text-left font-medium text-slate-400">Tanggal</th>
                <th className="h-12 px-4 text-left font-medium text-slate-400">Tipe</th>
                <th className="h-12 px-4 text-left font-medium text-slate-400">Kategori</th>
                <th className="h-12 px-4 text-left font-medium text-slate-400">Catatan</th>
                <th className="h-12 px-4 text-right font-medium text-slate-400">Jumlah</th>
                <th className="h-12 px-4 text-right font-medium text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i} className="h-14">
                  <td className="p-4"><div className="h-4 w-20 rounded animate-shimmer" /></td>
                  <td className="p-4"><div className="h-6 w-20 rounded-full animate-shimmer" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg animate-shimmer shrink-0" />
                      <div className="h-4 w-28 rounded animate-shimmer" />
                    </div>
                  </td>
                  <td className="p-4"><div className="h-4 w-36 rounded animate-shimmer" /></td>
                  <td className="p-4 text-right"><div className="h-4 w-24 rounded animate-shimmer ml-auto" /></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <div className="h-8 w-8 rounded-md animate-shimmer" />
                      <div className="h-8 w-8 rounded-md animate-shimmer" />
                      <div className="h-8 w-8 rounded-md animate-shimmer" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

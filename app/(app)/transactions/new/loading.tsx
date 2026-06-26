import AppShell from "@/components/layout/app-shell";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <AppShell
      activeNav="add"
      title="Tambah Transaksi"
      description="Catat pemasukan atau pengeluaran baru."
    >
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4 rounded-[26px] border border-[color:var(--stroke)] bg-[color:var(--surface)]/95 p-8 shadow-[0_26px_44px_-32px_rgba(47,35,16,0.4)] backdrop-blur">
        <LoadingSpinner size="lg" className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Menyiapkan form...</p>
      </div>
    </AppShell>
  );
}

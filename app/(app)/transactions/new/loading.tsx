import AppShell from "@/components/layout/app-shell";

export default function Loading() {
  return (
    <AppShell
      activeNav="add"
      title="Tambah Transaksi"
      description="Catat pemasukan atau pengeluaran baru."
    >
      <div className="flex w-full flex-col gap-6 rounded-lg p-6 shadow-sm" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
        
        {/* Tabs Skeleton */}
        <div className="flex w-full rounded-md p-1" style={{ backgroundColor: "var(--lk-bg)" }}>
          <div className="h-9 w-1/3 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-surface)" }} />
          <div className="h-9 w-1/3 animate-pulse rounded-md bg-transparent" />
          <div className="h-9 w-1/3 animate-pulse rounded-md bg-transparent" />
        </div>

        {/* Input Skeletons */}
        <div className="space-y-4 mt-2">
          <div>
            <div className="mb-2 h-4 w-20 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
            <div className="h-11 w-full animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
          </div>
          <div>
            <div className="mb-2 h-4 w-24 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
            <div className="h-11 w-full animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
          </div>
          <div>
            <div className="mb-2 h-4 w-32 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
            <div className="h-24 w-full animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="mt-4 h-12 w-full animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
        
      </div>
    </AppShell>
  );
}

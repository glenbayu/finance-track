import AppShell from "@/components/layout/app-shell";

export default function Loading() {
  return (
    <AppShell
      className="bg-[var(--lk-bg)]"
      activeNav={null}
      title="Memuat Halaman"
      description="Menyiapkan data keuangan terbarumu..."
      titleClassName="opacity-70 animate-pulse"
    >
      <div className="space-y-6">
        
        {/* Skeleton Top Cards */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex h-[110px] w-full flex-col justify-between rounded-lg p-5 shadow-sm" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl" style={{ backgroundColor: "var(--lk-bg)" }} />
                <div className="h-4 w-20 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
              </div>
              <div className="h-7 w-32 animate-pulse rounded-lg" style={{ backgroundColor: "var(--lk-bg)" }} />
            </div>
          ))}
        </section>

        {/* Skeleton Main Section (List/Chart Placeholder) */}
        <section className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <div className="mb-6 flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
            <div className="h-8 w-24 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
          </div>
          
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-5" style={{ borderBottom: "1px solid var(--lk-border)" }}>
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl" style={{ backgroundColor: "var(--lk-bg)" }} />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
                  <div className="h-3 w-1/5 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
                </div>
                <div className="h-6 w-20 shrink-0 animate-pulse rounded-md" style={{ backgroundColor: "var(--lk-bg)" }} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}

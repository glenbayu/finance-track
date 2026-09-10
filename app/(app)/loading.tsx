import AppShell from "@/components/layout/app-shell";

export default function AppLoading() {
  return (
    <AppShell title="Memuat halaman…" description="Menyiapkan data terbaru." activeNav={null}>
      <div role="status" aria-live="polite" aria-busy="true" className="section-card">
        <span className="sr-only">Memuat halaman, mohon tunggu.</span>
        <div aria-hidden="true" className="space-y-4">
          <div className="h-5 w-1/3 rounded animate-shimmer" />
          <div className="h-12 w-full rounded animate-shimmer" />
          <div className="h-12 w-full rounded animate-shimmer" />
          <div className="h-12 w-2/3 rounded animate-shimmer" />
        </div>
      </div>
    </AppShell>
  );
}

export default function Loading() {
  return (
    <main className="page-shell">
      <div className="page-container space-y-4">
        <div className="route-loading-bar" aria-hidden="true" />

        <section className="hero-panel">
          <div className="route-loading-block h-5 w-40 rounded-lg" />
          <div className="mt-3 route-loading-block h-9 w-64 rounded-xl" />
          <div className="mt-3 route-loading-block h-4 w-full max-w-xl rounded-lg" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="route-loading-block h-11 rounded-xl" />
            <div className="route-loading-block h-11 rounded-xl" />
            <div className="route-loading-block h-11 rounded-xl" />
            <div className="route-loading-block h-11 rounded-xl" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="stat-card">
            <div className="route-loading-block h-4 w-24 rounded-md" />
            <div className="mt-4 route-loading-block h-8 w-36 rounded-lg" />
          </div>
          <div className="stat-card">
            <div className="route-loading-block h-4 w-24 rounded-md" />
            <div className="mt-4 route-loading-block h-8 w-36 rounded-lg" />
          </div>
          <div className="stat-card">
            <div className="route-loading-block h-4 w-24 rounded-md" />
            <div className="mt-4 route-loading-block h-8 w-36 rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}

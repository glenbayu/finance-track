export default function Loading() {
  return (
    <main className="page-shell journal-dashboard">
      <div className="page-container space-y-5">
        <div className="route-loading-bar" aria-hidden="true" />

        <section className="hero-panel">
          <div className="route-loading-block h-4 w-36 rounded-lg" />
          <div className="mt-3 route-loading-block route-loading-delay-1 h-9 w-64 rounded-xl" />
          <div className="mt-3 route-loading-block route-loading-delay-2 h-4 w-full max-w-xl rounded-lg" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="route-loading-block route-loading-delay-1 h-11 rounded-xl" />
            <div className="route-loading-block route-loading-delay-2 h-11 rounded-xl" />
            <div className="route-loading-block route-loading-delay-3 h-11 rounded-xl" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div className="stat-card">
            <div className="route-loading-block h-4 w-24 rounded-md" />
            <div className="mt-4 route-loading-block route-loading-delay-1 h-8 w-36 rounded-lg" />
          </div>
          <div className="stat-card">
            <div className="route-loading-block h-4 w-24 rounded-md" />
            <div className="mt-4 route-loading-block route-loading-delay-2 h-8 w-36 rounded-lg" />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="section-card lg:col-span-7">
            <div className="route-loading-block h-5 w-48 rounded-lg" />
            <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="route-loading-block route-loading-delay-1 h-40 rounded-2xl" />
              <div className="space-y-3">
                <div className="route-loading-block route-loading-delay-1 h-14 rounded-xl" />
                <div className="route-loading-block route-loading-delay-2 h-14 rounded-xl" />
                <div className="route-loading-block route-loading-delay-3 h-14 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="section-card lg:col-span-5">
            <div className="route-loading-block h-5 w-52 rounded-lg" />
            <div className="mt-4 space-y-3">
              <div className="route-loading-block route-loading-delay-1 h-16 rounded-xl" />
              <div className="route-loading-block route-loading-delay-2 h-16 rounded-xl" />
              <div className="route-loading-block route-loading-delay-3 h-16 rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

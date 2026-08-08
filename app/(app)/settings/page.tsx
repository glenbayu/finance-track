import AppShell from "@/components/layout/app-shell";
import PwaInstallCard from "@/components/pwa/pwa-install-card";
import AppearanceCard from "@/components/settings/appearance-card";
import PreferencesCard from "@/components/settings/preferences-card";
import RecalculateRolloverCard from "@/components/settings/recalculate-rollover-card";

export default function SettingsPage() {
  return (
    <AppShell
      className="bg-[var(--lk-bg)]"
      activeNav="more"
      eyebrow="Preferensi Aplikasi"
      title="Pengaturan Lanjutan"
      description="Konfigurasi preferensi tampilan dan mata uang kamu."
    >
      <div className="mx-auto max-w-3xl pb-24 sm:pb-8 pt-4">
        {/* Kanvas Tunggal Besar */}
        <div className="overflow-hidden rounded-xl shadow-sm" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          
          <div className="p-6" style={{ borderBottom: "1px solid var(--lk-border)" }}>
            <h3 className="mb-4 text-[13px] font-bold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
              Tampilan
            </h3>
            <AppearanceCard flat />
          </div>

          <div className="p-6" style={{ borderBottom: "1px solid var(--lk-border)" }}>
            <h3 className="mb-4 text-[13px] font-bold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
              Bahasa & Mata Uang
            </h3>
            <PreferencesCard flat />
          </div>

          <div className="p-6">
            <h3 className="mb-4 text-[13px] font-bold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
              Data & Sinkronisasi
            </h3>
            <RecalculateRolloverCard flat />
          </div>

        </div>

        {/* PWA Card (Hanya untuk mobile, disembunyikan di desktop) */}
        <div className="mt-6 px-2 lg:hidden">
          <PwaInstallCard />
        </div>
      </div>
    </AppShell>
  );
}

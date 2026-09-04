import AppShell from "@/components/layout/app-shell";
import PwaInstallCard from "@/components/pwa/pwa-install-card";
import AppearanceCard from "@/components/settings/appearance-card";
import PreferencesCard from "@/components/settings/preferences-card";
import RecalculateRolloverCard from "@/components/settings/recalculate-rollover-card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell
      className="bg-[var(--lk-bg)]"
      activeNav="more"
      maxWidth="4xl"
      eyebrow="Preferensi Aplikasi"
      heroIcon={<Settings size={19} strokeWidth={2.2} />}
      title="Pengaturan Lanjutan"
      description="Konfigurasi preferensi tampilan dan mata uang kamu."
    >
      <div>
        {/* Kanvas Tunggal Besar */}
        <div className="overflow-hidden rounded-2xl shadow-xs" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border)" }}>
          
          <div className="p-5 sm:p-6" style={{ borderBottom: "1px solid var(--lk-border)" }}>
            <h3 className="mb-4 text-[13px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Tampilan
            </h3>
            <AppearanceCard flat />
          </div>

          <div className="p-5 sm:p-6" style={{ borderBottom: "1px solid var(--lk-border)" }}>
            <h3 className="mb-4 text-[13px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Bahasa & Mata Uang
            </h3>
            <PreferencesCard flat />
          </div>

          <div className="p-5 sm:p-6">
            <h3 className="mb-4 text-[13px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Data & Sinkronisasi
            </h3>
            <RecalculateRolloverCard flat />
          </div>

        </div>

        {/* PWA Card (Hanya untuk mobile, disembunyikan di desktop) */}
        <div className="mt-6 px-1 lg:hidden">
          <PwaInstallCard />
        </div>
      </div>
    </AppShell>
  );
}

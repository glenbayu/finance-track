import AppShell from "@/components/layout/app-shell";
import PwaInstallCard from "@/components/pwa/pwa-install-card";
import AppearanceCard from "@/components/settings/appearance-card";
import PreferencesCard from "@/components/settings/preferences-card";

export default function SettingsPage() {
  return (
    <AppShell
      className="bg-slate-50/50 dark:bg-slate-950/50"
      activeNav="more"
      title="Pengaturan Lanjutan"
      description="Konfigurasi preferensi tampilan dan mata uang kamu."
    >
      <div className="mx-auto max-w-md space-y-7 pb-24 sm:pb-8 pt-4">
        <AppearanceCard />
        <PreferencesCard />
        
        <div className="px-2">
          <PwaInstallCard />
        </div>
      </div>
    </AppShell>
  );
}

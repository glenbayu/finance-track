import AppShell from "@/components/layout/app-shell";
import ProfileCard from "@/components/settings/profile-card";
import AppearanceCard from "@/components/settings/appearance-card";
import PreferencesCard from "@/components/settings/preferences-card";
import AccountCard from "@/components/settings/account-card";
import QuickAddTemplatesCard from "@/components/settings/quick-add-templates-card";
import { requireUser } from "@/lib/supabase/auth";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="settings"
      title="Settings"
      description="Kelola tampilan, preferensi, dan akun kamu."
    >
      <section className="grid gap-4 xl:grid-cols-12 xl:items-start">
        <div className="space-y-4 xl:col-span-8">
          <ProfileCard email={user.email ?? "-"} />
          <AppearanceCard />
          <PreferencesCard />
        </div>
        <div className="space-y-4 xl:col-span-4">
          <div className="hidden lg:block">
            <QuickAddTemplatesCard />
          </div>
          <AccountCard />
        </div>
      </section>
    </AppShell>
  );
}

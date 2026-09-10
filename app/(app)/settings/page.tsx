import AppShell from "@/components/layout/app-shell";
import PwaInstallCard from "@/components/pwa/pwa-install-card";
import AppearanceCard from "@/components/settings/appearance-card";
import PreferencesCard from "@/components/settings/preferences-card";
import RecalculateRolloverCard from "@/components/settings/recalculate-rollover-card";
import { Settings } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import EditProfileModal from "@/components/more/edit-profile-modal";

export default async function SettingsPage() {
  const { user } = await requireUser();
  const email = user.email || "pengguna@example.com";
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
  const initial = fullName.charAt(0).toUpperCase();
  return (
    <AppShell
      className="bg-[var(--lk-bg)]"
      activeNav="settings"
      maxWidth="4xl"
      eyebrow="Preferensi Aplikasi"
      heroIcon={<Settings size={19} strokeWidth={2.2} />}
      title="Profil & Pengaturan"
      description="Kelola profil, preferensi tampilan, dan data keuangan kamu."
    >
      <div>
        <section className="mb-6 hidden rounded-2xl border p-5 lg:block" style={{ backgroundColor: "var(--lk-surface)", borderColor: "var(--lk-border)" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">{initial}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--lk-text-muted)" }}>Profil akun</p>
              <h2 className="truncate text-lg font-bold" style={{ color: "var(--lk-text)" }}>{fullName}</h2>
              <p className="truncate text-sm" style={{ color: "var(--lk-text-muted)" }}>{email}</p>
            </div>
            <EditProfileModal currentName={fullName} email={user.email || ""} emailVerified={Boolean(user.email_confirmed_at)} joinedAt={user.created_at} />
          </div>
        </section>

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
              Mata uang
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

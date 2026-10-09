import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import PwaInstallCard from "@/components/pwa/pwa-install-card";
import AppearanceCard from "@/components/settings/appearance-card";
import PreferencesCard from "@/components/settings/preferences-card";
import RecalculateRolloverCard from "@/components/settings/recalculate-rollover-card";
import { Settings, ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";

export default async function SettingsPage() {
  await requireUser();

  return (
    <AppShell
      className="bg-[var(--lk-bg)]"
      activeNav="settings"
      maxWidth="4xl"
      eyebrow="Preferensi Aplikasi"
      heroIcon={<Settings size={19} strokeWidth={2.2} />}
      title="Pengaturan Lanjutan"
      description="Preferensi privasi saldo, mata uang, dan sinkronisasi data."
    >
      <div className="mx-auto max-w-lg space-y-5 pb-12">
        {/* Navigation back to Akun Saya */}
        <div>
          <Link
            href="/more"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--lk-text-muted)] hover:text-[var(--lk-text)] transition-colors py-1 px-2.5 rounded-lg hover:bg-[var(--lk-surface-raised)]"
          >
            <ChevronLeft size={16} />
            <span>Kembali ke Akun Saya</span>
          </Link>
        </div>

        {/* Section 1: Privasi Saldo */}
        <section>
          <p
            style={{
              marginBottom: "0.4rem",
              paddingLeft: "0.25rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--lk-text-faint)",
            }}
          >
            Privasi
          </p>
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid var(--lk-border)",
              background: "var(--lk-surface)",
              overflow: "hidden",
            }}
          >
            <AppearanceCard flat />
          </div>
        </section>

        {/* Section 2: Mata Uang */}
        <section>
          <p
            style={{
              marginBottom: "0.4rem",
              paddingLeft: "0.25rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--lk-text-faint)",
            }}
          >
            Mata Uang & Konversi
          </p>
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid var(--lk-border)",
              background: "var(--lk-surface)",
              overflow: "hidden",
            }}
          >
            <PreferencesCard flat />
          </div>
        </section>

        {/* Section 3: Data & Sinkronisasi */}
        <section>
          <p
            style={{
              marginBottom: "0.4rem",
              paddingLeft: "0.25rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--lk-text-faint)",
            }}
          >
            Data & Sinkronisasi
          </p>
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid var(--lk-border)",
              background: "var(--lk-surface)",
              overflow: "hidden",
            }}
          >
            <RecalculateRolloverCard flat />
          </div>
        </section>

        {/* Section 4: PWA Card */}
        <div className="pt-1">
          <PwaInstallCard />
        </div>
      </div>
    </AppShell>
  );
}

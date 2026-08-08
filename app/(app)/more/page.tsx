import Link from "next/link";
import { 
  Settings, 
  Sparkles, 
  Tags, 
  Target, 
  Wallet, 
  ChevronRight
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import LogoutButton from "@/components/auth/logout-button";
import { requireUser } from "@/lib/supabase/auth";
import EditProfileModal from "@/components/more/edit-profile-modal";
import ThemeRow from "@/components/more/theme-row";

export default async function MorePage() {
  const { user } = await requireUser();
  const email = user?.email || "pengguna@example.com";
  const fullName = user?.user_metadata?.full_name || email.split("@")[0];
  const initial = fullName.charAt(0).toUpperCase();

  const dataManagementGroup = [
    {
      href: "/wallets",
      label: "Dompet & Rekening",
      icon: Wallet,
      colorClass: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    },
    {
      href: "/categories",
      label: "Kategori Transaksi",
      icon: Tags,
      colorClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    {
      href: "/budgets",
      label: "Anggaran (Budgets)",
      icon: Target,
      colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
      href: "/settings/templates",
      label: "Quick Add Templates",
      icon: Sparkles,
      colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    },
  ];

  const preferencesGroup = [
    {
      href: "/settings",
      label: "Pengaturan Lanjutan",
      icon: Settings,
      colorClass: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    },
  ];

  return (
    <AppShell
      className="bg-slate-50/50 dark:bg-slate-950/50"
      activeNav="more"
      eyebrow="Ruang Pribadi"
      title="Akun Saya"
      description="Kelola profil dan pengaturan aplikasi."
    >
      <div className="mx-auto max-w-md space-y-7 pb-24 sm:pb-8">
        
        {/* Profile Header */}
        <section className="flex items-start gap-4 px-2">
          <div className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-md">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-900 dark:text-white">
              {fullName}
            </h2>
            <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">
              {email}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                Akun Aktif
              </div>
              <EditProfileModal currentName={fullName} />
            </div>
          </div>
        </section>

        {/* Data & Management Group */}
        <section>
          <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">
            Data Keuangan
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 dark:border-slate-800 dark:bg-slate-900">
            {dataManagementGroup.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/50 dark:active:bg-slate-800"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.colorClass}`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="flex-1 text-[15px] font-medium text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Preferences Group */}
        <section>
          <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">
            Preferensi
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 dark:border-slate-800 dark:bg-slate-900">
            <ThemeRow />
            {preferencesGroup.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/50 dark:active:bg-slate-800"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.colorClass}`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="flex-1 text-[15px] font-medium text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Logout Section */}
        <section className="px-2 pt-2">
          <LogoutButton 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3.5 font-semibold text-red-600 transition-colors hover:bg-red-100 active:bg-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20" 
          />
        </section>
        
        {/* Footer info */}
        <div className="text-center pb-4 opacity-50">
          <p className="text-[11px] font-medium text-slate-500">Finance Tracker v1.0.0</p>
        </div>
      </div>
    </AppShell>
  );
}

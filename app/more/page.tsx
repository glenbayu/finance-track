import Link from "next/link";
import { LogOut, Settings, Sparkles, Tags, Target } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import LogoutButton from "@/components/auth/logout-button";
import { requireUser } from "@/lib/supabase/auth";

export default async function MorePage() {
  await requireUser();

  const menuItems = [
    {
      href: "/budgets",
      label: "Budgets",
      description: "Atur limit pengeluaran per kategori.",
      icon: Target,
    },
    {
      href: "/categories",
      label: "Categories",
      description: "Kelola kategori pemasukan dan pengeluaran.",
      icon: Tags,
    },
    {
      href: "/settings",
      label: "Settings",
      description: "Atur tampilan dan akun kamu.",
      icon: Settings,
    },
    {
      href: "/settings/templates",
      label: "Quick Add Templates",
      description: "Kelola shortcut tambah transaksi.",
      icon: Sparkles,
    },
  ];

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="more"
      title="More"
      description="Akses menu tambahan untuk mengatur finance tracker."
    >
      <section className="grid gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="section-card transition hover:brightness-[0.99]">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}

        <article className="section-card">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
                <LogOut size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold">Logout</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Keluar dari akun di perangkat ini.
              </p>
              <div className="mt-4">
                <LogoutButton className="btn-secondary gap-2" />
              </div>
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
}

import { LogOut } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";

export default function AccountCard() {
  return (
    <article className="section-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <LogOut size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Keluar dari sesi login saat ini.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <LogoutButton className="btn-secondary gap-2" />
      </div>
    </article>
  );
}


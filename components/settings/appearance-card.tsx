"use client";

import { Eye, EyeOff, MonitorCog } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { useAmountPrivacy } from "@/hooks/use-amount-privacy";

export default function AppearanceCard() {
  const { isHiddenByDefault, toggleHiddenByDefault } = useAmountPrivacy();

  return (
    <article className="section-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <MonitorCog size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atur tema dan preferensi tampilan nominal.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="soft-inset flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Light atau Dark</p>
          </div>
          <ThemeToggleButton
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2"
            showLabel
          />
        </div>

        <div className="soft-inset flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Sembunyikan nominal secara default
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nilai uang otomatis disamarkan saat halaman dibuka.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleHiddenByDefault}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${
              isHiddenByDefault
                ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-[color:var(--stroke)] bg-[color:var(--surface)] text-slate-700 dark:text-slate-200"
            }`}
            aria-pressed={isHiddenByDefault}
          >
            {isHiddenByDefault ? <EyeOff size={15} /> : <Eye size={15} />}
            {isHiddenByDefault ? "Aktif" : "Nonaktif"}
          </button>
        </div>
      </div>
    </article>
  );
}


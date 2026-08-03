"use client";

import { Eye, EyeOff, MonitorCog } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { useAmountPrivacy } from "@/hooks/use-amount-privacy";

export default function AppearanceCard() {
  const { isHiddenByDefault, toggleHiddenByDefault } = useAmountPrivacy();

  return (
    <section>
      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">
        Tampilan
      </h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Theme Toggle (Kept for redundancy or users accessing direct URL) */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100">Tema Gelap (Dark Mode)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Atur tampilan antarmuka.</p>
          </div>
          <ThemeToggleButton
            className="flex items-center justify-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            showLabel
          />
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between p-4">
          <div className="min-w-0 pr-4">
            <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100">
              Sembunyikan Nominal
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nilai uang otomatis disamarkan.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleHiddenByDefault}
            className={`shrink-0 flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isHiddenByDefault
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
            aria-pressed={isHiddenByDefault}
          >
            {isHiddenByDefault ? <EyeOff size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}
            {isHiddenByDefault ? "Aktif" : "Nonaktif"}
          </button>
        </div>
      </div>
    </section>
  );
}


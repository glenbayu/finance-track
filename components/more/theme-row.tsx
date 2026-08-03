"use client";

import { MonitorCog } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

export default function ThemeRow() {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
          <MonitorCog size={18} strokeWidth={2.5} />
        </div>
        <span className="flex-1 text-[15px] font-medium text-slate-800 dark:text-slate-200">
          Mode Gelap
        </span>
      </div>
      <ThemeToggleButton
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        showLabel={true}
      />
    </div>
  );
}

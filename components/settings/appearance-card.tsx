"use client";

import { Eye, EyeOff } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { useAmountPrivacy } from "@/hooks/use-amount-privacy";

type AppearanceCardProps = {
  flat?: boolean;
};

export default function AppearanceCard({ flat = false }: AppearanceCardProps) {
  const { isHiddenByDefault, toggleHiddenByDefault } = useAmountPrivacy();

  const content = (
    <div className={`divide-y ${
      flat ? "" : "overflow-hidden rounded-lg shadow-sm"
    }`} style={!flat ? { backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" } : { borderColor: "var(--lk-border)" }}>
        
        {/* Theme Toggle (Kept for redundancy or users accessing direct URL) */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--lk-border)" }}>
          <div>
            <p className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>Tema Gelap (Dark Mode)</p>
            <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>Atur tampilan antarmuka.</p>
          </div>
          <ThemeToggleButton
            className="flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 bg-[var(--lk-bg)] text-[var(--lk-text)] border border-[var(--lk-border)]"
            showLabel
          />
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--lk-border)" }}>
          <div className="min-w-0 pr-4">
            <p className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
              Sembunyikan Nominal
            </p>
            <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
              Nilai uang otomatis disamarkan.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleHiddenByDefault}
            className={`shrink-0 flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80`}
            style={{
              backgroundColor: isHiddenByDefault ? "var(--lk-income-dim)" : "var(--lk-bg)",
              color: isHiddenByDefault ? "var(--lk-income)" : "var(--lk-text)",
              border: isHiddenByDefault ? "none" : "1px solid var(--lk-border)"
            }}
            aria-pressed={isHiddenByDefault}
          >
            {isHiddenByDefault ? <EyeOff size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}
            {isHiddenByDefault ? "Aktif" : "Nonaktif"}
          </button>
        </div>
      </div>
  );

  if (flat) return content;

  return (
    <section>
      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
        Tampilan
      </h3>
      {content}
    </section>
  );
}


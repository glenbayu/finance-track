"use client";

import { Eye, EyeOff } from "lucide-react";
import { useAmountPrivacy } from "@/hooks/use-amount-privacy";

type AppearanceCardProps = {
  flat?: boolean;
};

export default function AppearanceCard({ flat = false }: AppearanceCardProps) {
  const { isHiddenByDefault, toggleHiddenByDefault } = useAmountPrivacy();

  const content = (
    <div
      className={flat ? "" : "overflow-hidden rounded-lg shadow-sm"}
      style={
        !flat
          ? { backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }
          : {}
      }
    >
      {/* Privacy Toggle */}
      <div className="settings-preference-row flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
            Sembunyikan Nominal
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--lk-text-muted)" }}>
            Nominal dan grafik disamarkan. Nilai dalam formulir tetap terlihat saat diedit.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleHiddenByDefault}
          className="shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{
            backgroundColor: isHiddenByDefault ? "var(--lk-income-dim)" : "var(--lk-surface-hover)",
            color: isHiddenByDefault ? "var(--lk-income)" : "var(--lk-text)",
            border: isHiddenByDefault ? "none" : "1px solid var(--lk-border)",
          }}
          aria-pressed={isHiddenByDefault}
        >
          {isHiddenByDefault ? <EyeOff size={14} /> : <Eye size={14} />}
          {isHiddenByDefault ? "Aktif" : "Nonaktif"}
        </button>
      </div>
    </div>
  );

  if (flat) return content;

  return (
    <section>
      <h3
        className="mb-2 px-4 text-[13px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--lk-text-muted)" }}
      >
        Privasi Saldo
      </h3>
      {content}
    </section>
  );
}

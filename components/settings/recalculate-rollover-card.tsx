"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { handleRecalculateRollovers } from "@/app/(app)/settings/actions";

type RecalculateRolloverCardProps = {
  flat?: boolean;
};

export default function RecalculateRolloverCard({ flat = false }: RecalculateRolloverCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onRecalculate = async () => {
    if (!confirm("Hitung ulang rollover saldo bulan lalu dan biaya admin untuk bulan ini? Rollover yang sudah ada akan diperbarui.")) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await handleRecalculateRollovers();
      if (res.ok) {
        setMessage({ type: "success", text: "Saldo rollover berhasil dihitung ulang!" });
      } else {
        setMessage({ type: "error", text: res.error || "Gagal menghitung ulang rollover." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className={flat ? "" : "overflow-hidden rounded-lg shadow-sm"} style={!flat ? { backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" } : {}}>
      <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <label className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
                Hitung Ulang Rollover
              </label>
              <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
                Hitung ulang saldo sisa (rollover) dan biaya admin otomatis berdasarkan transaksi bulan lalu.
              </p>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={onRecalculate}
              className={`shrink-0 inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50`}
              style={{ backgroundColor: "var(--lk-text)", color: "var(--lk-bg)" }}
            >
              <RefreshCw size={14} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Memproses..." : "Hitung Ulang"}
            </button>
          </div>

          {message && (
            <div
              className="rounded-lg p-3 text-xs border"
              style={{ 
                backgroundColor: message.type === "success" ? "var(--lk-income-dim)" : "var(--lk-expense-dim)",
                borderColor: message.type === "success" ? "var(--lk-income)" : "var(--lk-expense)",
                color: message.type === "success" ? "var(--lk-income)" : "var(--lk-expense)"
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
  );

  if (flat) return content;

  return (
    <section>
      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
        Data & Sinkronisasi
      </h3>
      {content}
    </section>
  );
}
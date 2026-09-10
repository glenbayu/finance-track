"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { handleRecalculateRollovers } from "@/app/(app)/settings/actions";
import ConfirmationModal from "@/components/ui/confirmation-modal";

type RecalculateRolloverCardProps = {
  flat?: boolean;
};

export default function RecalculateRolloverCard({ flat = false }: RecalculateRolloverCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onConfirmRecalculate = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await handleRecalculateRollovers();
      if (res.ok) {
        setMessage({ type: "success", text: "Saldo rollover berhasil dihitung ulang!" });
        setIsConfirmOpen(false);
      } else {
        setMessage({ type: "error", text: res.error || "Gagal menghitung ulang rollover." });
        setIsConfirmOpen(false);
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi." });
      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className={flat ? "" : "overflow-hidden rounded-lg shadow-sm"} style={!flat ? { backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" } : {}}>
      <div className="p-4 space-y-4">
          <div className="settings-preference-row flex items-start justify-between gap-4">
            <div className="min-w-0">
              <label className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
                Hitung Ulang Rollover
              </label>
              <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
                Rollover juga diproses otomatis saat Ringkasan dibuka. Gunakan hitung ulang untuk memperbarui hasil setelah mengubah transaksi bulan lalu; biaya mengikuti pengaturan dompet.
              </p>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsConfirmOpen(true)}
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
              role={message.type === "error" ? "alert" : "status"}
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

        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => !isLoading && setIsConfirmOpen(false)}
          title="Hitung Ulang Rollover?"
          description="Hitung ulang rollover saldo bulan lalu dan biaya admin untuk bulan ini? Data rollover yang sudah ada akan diperbarui secara otomatis."
          icon={
            <div
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--lk-primary-dim)", color: "var(--lk-primary-light)" }}
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </div>
          }
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-primary w-full sm:w-auto font-semibold inline-flex items-center justify-center gap-2"
              onClick={onConfirmRecalculate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                "Ya, Hitung Ulang"
              )}
            </button>
          </div>
        </ConfirmationModal>
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

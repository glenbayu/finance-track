"use client";

import FormSelect from "@/components/ui/form-select";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

type PreferencesCardProps = {
  flat?: boolean;
};

export default function PreferencesCard({ flat = false }: PreferencesCardProps) {
  const {
    currency,
    setCurrency,
    formatFromIDR,
    lastUpdated,
    isRateLoading,
    isFallbackToIDR,
  } = useDisplayCurrency();

  const currencyLabels: Record<(typeof SUPPORTED_CURRENCIES)[number], string> = {
    IDR: "Rupiah (IDR)",
    USD: "US Dollar (USD)",
    JPY: "Yen Jepang (JPY)",
    EUR: "Euro (EUR)",
    SGD: "Dollar Singapura (SGD)",
    AUD: "Dollar Australia (AUD)",
    MYR: "Ringgit Malaysia (MYR)",
  };

  const content = (
    <div className={flat ? "" : "overflow-hidden rounded-lg shadow-sm"} style={!flat ? { backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" } : {}}>
      <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <label className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
                Mata Uang Layar
              </label>
              <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
                Pilih mata uang untuk menampilkan nominal di dashboard.
              </p>
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <FormSelect
                name="display_currency"
                value={currency}
                onValueChange={(nextValue) =>
                  setCurrency(
                    nextValue as (typeof SUPPORTED_CURRENCIES)[number],
                  )
                }
                options={SUPPORTED_CURRENCIES.map((currencyCode) => ({
                  value: currencyCode,
                  label: currencyLabels[currencyCode],
                }))}
                required
              />
            </div>
          </div>
          
          <div className="mt-5 rounded-lg p-4 text-sm" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
            <h4 className="font-semibold mb-2" style={{ color: "var(--lk-text)" }}>Simulasi Konversi</h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span style={{ color: "var(--lk-text-muted)" }}>Rp 1.000.000 =</span>
              <span className="font-bold text-lg" style={{ color: "var(--lk-text)" }}>
                {isRateLoading ? "..." : formatFromIDR(1_000_000)}
              </span>
            </div>
            
            {/* Status Information */}
            <div className="mt-4 pt-3 space-y-1" style={{ borderTop: "1px solid var(--lk-border)" }}>
              {lastUpdated && (
                <p className="text-[11px]" style={{ color: "var(--lk-text-muted)" }}>
                  Kurs referensi terakhir: {lastUpdated}
                </p>
              )}
              {isFallbackToIDR && (
                <p className="text-[11px] font-medium" style={{ color: "var(--lk-expense)" }}>
                  Kurs belum tersedia, kembali ke IDR.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  );

  if (flat) return content;

  return (
    <section>
      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
        Bahasa & Mata Uang
      </h3>
      {content}
    </section>
  );
}

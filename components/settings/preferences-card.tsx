"use client";

import { SlidersHorizontal } from "lucide-react";
import FormSelect from "@/components/ui/form-select";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

export default function PreferencesCard() {
  const {
    currency,
    effectiveCurrency,
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

  return (
    <section>
      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">
        Bahasa & Mata Uang
      </h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <label className="text-[15px] font-medium text-slate-900 dark:text-slate-100">
                Mata Uang Layar
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
          
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Simulasi Konversi</h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Rp 1.000.000 =</span>
              <span className="font-bold text-slate-900 dark:text-white text-lg">
                {isRateLoading ? "..." : formatFromIDR(1_000_000)}
              </span>
            </div>
            
            {/* Status Information */}
            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1">
              {lastUpdated && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kurs referensi terakhir: {lastUpdated}
                </p>
              )}
              {isFallbackToIDR && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Kurs belum tersedia, kembali ke IDR.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

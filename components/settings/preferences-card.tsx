"use client";

import { SlidersHorizontal } from "lucide-react";
import FormSelect from "@/components/ui/form-select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
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
    <article className="section-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <SlidersHorizontal size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Preferences</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Preferensi bawaan aplikasi (read-only).
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="soft-inset">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Display currency
          </label>
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
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Data tetap disimpan dalam Rupiah. Mata uang ini hanya mengubah tampilan berdasarkan kurs terbaru.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            Rp1.000.000 ~ {formatFromIDR(1_000_000)}
          </p>
          {isRateLoading ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Memuat kurs terbaru...
            </p>
          ) : null}
          {lastUpdated ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Kurs referensi terakhir: {lastUpdated}
            </p>
          ) : null}
          {isFallbackToIDR ? (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
              Kurs belum tersedia, tampilan sementara kembali ke IDR.
            </p>
          ) : null}
          {effectiveCurrency !== currency ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tampilan aktif: {effectiveCurrency}
            </p>
          ) : null}
        </div>

        <div className="soft-inset flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-400">Currency (active)</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {effectiveCurrency}
          </span>
        </div>
        <div className="soft-inset flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-400">Locale</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Indonesia / id-ID
          </span>
        </div>
        <div className="soft-inset flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-400">Date format</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            DD MMM YYYY
          </span>
        </div>
        <div className="soft-inset flex items-center justify-between gap-3">
          <span className="text-slate-500 dark:text-slate-400">
            Default dashboard period
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Current month
          </span>
        </div>
      </div>
    </article>
  );
}

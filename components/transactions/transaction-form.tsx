"use client";

import { useMemo, useState } from "react";
import FormSelect from "@/components/ui/form-select";
import DateInput from "@/components/ui/date-input";
import SubmitButton from "@/components/ui/submit-button";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type Wallet = {
  id: string;
  name: string;
  type: string;
};

type RecentCategory = {
  id: string;
  name: string;
  type: "income" | "expense";
  count: number;
};

type TransactionFormProps = {
  categories: Category[];
  wallets: Wallet[];
  defaultDate: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: {
    type?: "income" | "expense" | "transfer";
    categoryId?: string | null;
    amountIDR?: number | null;
    note?: string | null;
    walletId?: string | null;
  };
  infoMessage?: string | null;
  recentCategories?: RecentCategory[];
};

const NOTE_MAX_LENGTH = 140;

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");

  if (!numeric) return "";

  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function TransactionForm({
  categories,
  wallets,
  defaultDate,
  action,
  initialValues,
  infoMessage,
  recentCategories = [],
}: TransactionFormProps) {
  const defaultType = (initialValues?.type === "income" || initialValues?.type === "expense" || initialValues?.type === "transfer") ? initialValues.type : "expense";
  const [type, setType] = useState<"income" | "expense" | "transfer">(defaultType);
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [walletId, setWalletId] = useState(initialValues?.walletId ?? (wallets[0]?.id ?? ""));
  const [destinationWalletId, setDestinationWalletId] = useState(wallets.length > 1 ? wallets[1].id : "");
  const [amountDisplay, setAmountDisplay] = useState(
    initialValues?.amountIDR ? formatRupiahInput(String(initialValues.amountIDR)) : "",
  );

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const recentCategoryChips = useMemo(() => {
    const allowedIds = new Set(filteredCategories.map((category) => category.id));
    return recentCategories
      .filter((category) => category.type === type && allowedIds.has(category.id))
      .slice(0, 5);
  }, [filteredCategories, recentCategories, type]);

  return (
    <form action={action} className="section-card mt-6 space-y-5">
      {infoMessage ? (
        <div className="soft-inset border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-300">
          {infoMessage}
        </div>
      ) : null}

      <div className="soft-inset">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Tipe</label>
        <FormSelect
          name="type"
          value={type}
          onValueChange={(nextValue) => {
            setType(nextValue as "income" | "expense" | "transfer");
            setCategoryId("");
          }}
          options={[
            { value: "expense", label: "Pengeluaran" },
            { value: "income", label: "Pemasukan" },
            { value: "transfer", label: "Transfer / Mutasi" },
          ]}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Jumlah</label>

          <input
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 50.000"
            value={amountDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setAmountDisplay(formatRupiahInput(raw));
            }}
            className="input-base"
            required
          />

          <input
            type="hidden"
            name="amount"
            value={amountDisplay.replace(/\D/g, "")}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nominal disimpan dalam Rupiah (IDR).
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Tanggal</label>
          <DateInput
            name="transaction_date"
            defaultValue={defaultDate}
            className="input-base"
            required
          />
        </div>
      </div>

      <div className={`grid gap-4 ${type === 'transfer' ? 'md:grid-cols-2' : ''}`}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {type === 'transfer' ? 'Dompet Asal' : 'Dompet'}
          </label>
          <FormSelect
            name="wallet_id"
            value={walletId}
            onValueChange={setWalletId}
            options={wallets.map(w => ({ value: w.id, label: w.name }))}
            required
          />
        </div>
        
        {type === 'transfer' && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Dompet Tujuan</label>
            <FormSelect
              name="destination_wallet_id"
              value={destinationWalletId}
              onValueChange={setDestinationWalletId}
              options={wallets.map(w => ({ value: w.id, label: w.name }))}
              required
            />
          </div>
        )}
      </div>

      {type !== 'transfer' && (
      <div>
        {recentCategoryChips.length ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kategori sering dipakai:
            </span>
            {recentCategoryChips.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  categoryId === category.id
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-200 dark:hover:bg-slate-800/40"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : null}
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Kategori</label>
        <FormSelect
          name="category_id"
          value={categoryId}
          onValueChange={setCategoryId}
          options={[
            { value: "", label: "Pilih kategori", disabled: true },
            ...filteredCategories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
          required
          placeholder="Pilih kategori"
        />
      </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Catatan</label>
        <textarea
          name="note"
          rows={4}
          placeholder="Contoh: makan siang, gaji bulanan, dll"
          maxLength={NOTE_MAX_LENGTH}
          defaultValue={initialValues?.note ?? ""}
          className="input-base textarea-base resize-none"
        />
      </div>

      <SubmitButton
        className="btn-primary w-full py-3 text-base"
        pendingText="Menyimpan..."
      >
        Simpan Transaksi
      </SubmitButton>
    </form>
  );
}

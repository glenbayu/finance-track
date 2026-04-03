"use client";

import { useMemo, useState } from "react";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type TransactionFormProps = {
  categories: Category[];
  defaultDate: string;
  action: (formData: FormData) => void | Promise<void>;
};

const NOTE_MAX_LENGTH = 140;

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");

  if (!numeric) return "";

  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function TransactionForm({
  categories,
  defaultDate,
  action,
}: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  return (
    <form action={action} className="section-card mt-6 space-y-5">
      <div className="soft-inset">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Tipe</label>
        <FormSelect
          name="type"
          value={type}
          onValueChange={(nextValue) => {
            setType(nextValue as "income" | "expense");
            setCategoryId("");
          }}
          options={[
            { value: "expense", label: "Pengeluaran" },
            { value: "income", label: "Pemasukan" },
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
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Tanggal</label>
          <input
            type="date"
            name="transaction_date"
            defaultValue={defaultDate}
            className="input-base"
            required
          />
        </div>
      </div>

      <div>
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

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Catatan</label>
        <textarea
          name="note"
          rows={4}
          placeholder="Contoh: makan siang, gaji bulanan, dll"
          maxLength={NOTE_MAX_LENGTH}
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

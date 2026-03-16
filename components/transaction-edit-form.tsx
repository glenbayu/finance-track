"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FormSelect from "@/components/form-select";
import SubmitButton from "@/components/submit-button";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  note: string | null;
  transaction_date: string;
};

type TransactionEditFormProps = {
  transaction: Transaction;
  categories: Category[];
  action: (formData: FormData) => void;
};

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");

  if (!numeric) return "";

  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function TransactionEditForm({
  transaction,
  categories,
  action,
}: TransactionEditFormProps) {
  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [amountDisplay, setAmountDisplay] = useState(formatRupiahInput(transaction.amount.toString()));

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  return (
    <form action={action} className="section-card mt-6 space-y-5">
      <input type="hidden" name="id" value={transaction.id} />

      <div className="soft-inset">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Tipe</label>
        <FormSelect
          name="type"
          value={type}
          onValueChange={(nextValue) => {
            const nextType = nextValue as "income" | "expense";
            const hasMatchingCategory = categories.some(
              (item) => item.type === nextType && item.id === categoryId,
            );

            setType(nextType);

            if (!hasMatchingCategory) {
              setCategoryId("");
            }
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
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Jumlah</label>
          <input
            type="text"
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
            defaultValue={transaction.transaction_date}
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
          defaultValue={transaction.note ?? ""}
          className="input-base textarea-base resize-none"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <SubmitButton
          className="btn-primary flex-1 py-3 text-base"
          pendingText="Mengupdate..."
        >
          Update Transaksi
        </SubmitButton>

        <Link
          href="/transactions"
          className="btn-secondary flex-1 py-3 text-base"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import FormSelect from "@/components/form-select";
import SubmitButton from "@/components/submit-button";
import { ChevronDown } from "lucide-react";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type QuickAddTransactionProps = {
  categories: Category[];
  action: (formData: FormData) => void | Promise<void>;
};

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");

  if (!numeric) return "";

  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function QuickAddTransaction({
  categories,
  action,
}: QuickAddTransactionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  return (
    <div className="section-card">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h2 className="text-xl font-semibold">Quick Add</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Catat transaksi cepat tanpa buka form lengkap
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded ? (
        <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="note" value="Quick Add" />
        <div>
          <label className="mb-2 block text-sm font-medium">Tipe</label>
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

        <div>
          <label className="mb-2 block text-sm font-medium">Jumlah</label>
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
          <label className="mb-2 block text-sm font-medium">Kategori</label>
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

        <SubmitButton
          className="btn-primary w-full py-3 text-base"
          pendingText="Menyimpan..."
        >
          Simpan Cepat
        </SubmitButton>
        </form>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Form disembunyikan. Klik untuk buka.
        </p>
      )}
    </div>
  );
}

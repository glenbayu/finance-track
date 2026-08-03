"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Tag,
  Wallet,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  Settings2,
} from "lucide-react";
import FormSelect from "@/components/ui/form-select";
import DateInput from "@/components/ui/date-input";
import SubmitButton from "@/components/ui/submit-button";
import DeleteTransactionButton from "@/components/transactions/delete-transaction-button";

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

type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  amount: number;
  category_id: string | null;
  wallet_id: string | null;
  destination_wallet_id: string | null;
  note: string | null;
  transaction_date: string;
};

type TransactionEditFormProps = {
  transaction: Transaction;
  categories: Category[];
  wallets: Wallet[];
  action: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
};

const NOTE_MAX_LENGTH = 140;

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function TransactionEditForm({
  transaction,
  categories,
  wallets,
  action,
  deleteAction,
}: TransactionEditFormProps) {
  const [type, setType] = useState<"income" | "expense" | "transfer" | "adjustment">(
    transaction.type,
  );
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [walletId, setWalletId] = useState(
    transaction.wallet_id ?? (wallets[0]?.id ?? ""),
  );
  const [destinationWalletId, setDestinationWalletId] = useState(
    transaction.destination_wallet_id ?? (wallets.length > 1 ? wallets[1].id : ""),
  );
  const [amountDisplay, setAmountDisplay] = useState(
    formatRupiahInput(transaction.amount.toString()),
  );
  const [noteText, setNoteText] = useState(transaction.note ?? "");

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const isAdjustment = type === "adjustment";

  /* ─── Accent helpers ─── */
  const accentText =
    type === "expense"
      ? "text-rose-600 dark:text-rose-400"
      : type === "income"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-blue-600 dark:text-blue-400";

  const accentPlaceholder =
    type === "expense"
      ? "placeholder:text-rose-300/40 dark:placeholder:text-rose-700/20"
      : type === "income"
        ? "placeholder:text-emerald-300/40 dark:placeholder:text-emerald-700/20"
        : "placeholder:text-blue-300/40 dark:placeholder:text-blue-700/20";

  const submitCls =
    type === "expense"
      ? "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500"
      : type === "income"
        ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
        : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500";

  const capsuleColor =
    type === "expense"
      ? "bg-rose-500"
      : type === "income"
        ? "bg-emerald-500"
        : "bg-blue-500";

  return (
    <div className="section-card mt-4 p-4 sm:p-5">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={transaction.id} />

      {/* ── 1. Segmented Control / Adjustment Badge ── */}
      {!isAdjustment ? (
        <div className="relative rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/70 ring-1 ring-black/5 dark:ring-white/5">
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(33.333%-2px)] rounded-xl shadow-sm ${capsuleColor} transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
            style={{
              transform:
                type === "expense"
                  ? "translateX(0)"
                  : type === "income"
                    ? "translateX(calc(100% + 4px))"
                    : "translateX(calc(200% + 8px))",
            }}
          />
          <div className="relative grid grid-cols-3">
            {(
              [
                { id: "expense", label: "Pengeluaran", Icon: ArrowDownLeft },
                { id: "income", label: "Pemasukan", Icon: ArrowUpRight },
                { id: "transfer", label: "Transfer", Icon: ArrowLeftRight },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const hasMatchingCat = categories.some(
                    (item) => item.type === id && item.id === categoryId,
                  );
                  setType(id);
                  if (!hasMatchingCat) setCategoryId("");
                }}
                className={`relative z-10 flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors duration-200 sm:gap-1.5 sm:text-sm ${
                  type === id
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={14} className="shrink-0 sm:size-4" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Adjustment badge */
        <div className="flex items-center gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-850/60 ring-1 ring-black/5 dark:ring-white/5">
          <Settings2 size={18} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-355">
            Penyesuaian Saldo (Read-only type)
          </span>
        </div>
      )}

      <input type="hidden" name="type" value={type} />

      {/* ── 2. Borderless Hero Amount Input ── */}
      <div className="flex flex-col items-center justify-center py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
          Nominal Transaksi
        </p>
        <div className="flex w-full items-baseline justify-center gap-1.5 px-4">
          <span className={`text-xl font-extrabold ${accentText} transition-colors duration-300`}>
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amountDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setAmountDisplay(formatRupiahInput(raw));
            }}
            className={`w-44 bg-transparent text-left text-4xl font-extrabold outline-none border-none p-0 focus:ring-0 ${accentText} ${accentPlaceholder} transition-colors duration-300`}
            required
          />
        </div>
        <input type="hidden" name="amount" value={amountDisplay.replace(/\D/g, "")} />
      </div>

      {/* ── 3. Grouped Row List (iOS Settings / Modern Banking Style) ── */}
      <div className="overflow-hidden rounded-xl border border-slate-250/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
        
        {/* ROW 1: Tanggal */}
        <div className="flex items-center gap-3.5 p-3 sm:p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400">
            <Calendar size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tanggal
            </label>
            <DateInput
              name="transaction_date"
              defaultValue={transaction.transaction_date}
              className="input-base w-full"
              required
            />
          </div>
        </div>

        {/* ROW 2: Dompet Asal / Dompet */}
        <div className="flex items-center gap-3.5 p-3 sm:p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950/40 dark:text-purple-400">
            <Wallet size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {type === "transfer" ? "Dompet Asal" : "Dompet"}
            </label>
            <FormSelect
              name="wallet_id"
              value={walletId}
              onValueChange={setWalletId}
              options={wallets.map((w) => ({ value: w.id, label: w.name }))}
              required
            />
          </div>
        </div>

        {/* ROW 3: Dompet Tujuan (Transfer only) */}
        {type === "transfer" && (
          <div className="flex items-center gap-3.5 p-3 sm:p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Landmark size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Dompet Tujuan
              </label>
              <FormSelect
                name="destination_wallet_id"
                value={destinationWalletId}
                onValueChange={setDestinationWalletId}
                options={wallets.map((w) => ({ value: w.id, label: w.name }))}
                required
              />
            </div>
          </div>
        )}

        {/* ROW 4: Kategori (Expense/Income only) */}
        {type !== "transfer" && type !== "adjustment" && (
          <div className="flex items-start gap-3.5 p-3 sm:p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400 mt-1">
              <Tag size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Kategori
              </label>
              <FormSelect
                name="category_id"
                value={categoryId}
                onValueChange={setCategoryId}
                options={[
                  { value: "", label: "Pilih kategori", disabled: true },
                  ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                required
                placeholder="Pilih kategori"
              />
            </div>
          </div>
        )}

        {/* ROW 5: Catatan */}
        <div className="flex items-start gap-3.5 p-3 sm:p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400 mt-1">
            <FileText size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center justify-between">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Catatan <span className="font-normal lowercase">(opsional)</span>
              </label>
              <span
                className={`text-[9px] font-semibold tabular-nums transition-colors ${
                  noteText.length >= NOTE_MAX_LENGTH * 0.9 ? "text-rose-500" : "text-slate-400"
                }`}
              >
                {noteText.length}/{NOTE_MAX_LENGTH}
              </span>
            </div>
            <textarea
              name="note"
              rows={3}
              placeholder="Contoh: makan siang, bayar tagihan, dll..."
              maxLength={NOTE_MAX_LENGTH}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="input-base textarea-base resize-none text-base"
            />
          </div>
        </div>

      </div>

      {/* ── 4. Action Buttons ── */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Link
          href="/transactions"
          className="btn-secondary flex-1 py-3 text-center text-base"
        >
          Batal
        </Link>
        <SubmitButton
          className={`flex-1 rounded-xl py-3 text-base font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${submitCls}`}
          pendingText="Mengupdate..."
        >
          Update Transaksi
        </SubmitButton>
      </div>
    </form>
    
    <div className="border-t border-slate-100 pt-4 mt-4 dark:border-slate-800 flex justify-center">
      <DeleteTransactionButton
        id={transaction.id}
        action={deleteAction}
        className="w-full rounded-xl border border-rose-200 bg-rose-50/50 py-3 text-center text-sm font-semibold text-rose-700 hover:bg-rose-100/70 transition-colors flex items-center justify-center dark:border-rose-950/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/20"
        label="Hapus Transaksi Ini"
      />
    </div>
  </div>
  );
}

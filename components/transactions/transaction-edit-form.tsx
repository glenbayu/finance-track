"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Copy,
  Settings2,
} from "lucide-react";
import { TransactionReturnLink } from "@/components/transactions/transaction-list-context";
import FilterSelect from "@/components/transactions/filter-select";
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
  return (value.startsWith("-") ? "-" : "") + new Intl.NumberFormat("id-ID").format(Number(numeric));
}

/* Label + isi field. Didefinisikan di luar komponen utama supaya tidak di-remount tiap render. */
function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold"
          style={{ color: "var(--lk-text-muted)" }}
        >
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
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
    transaction.destination_wallet_id ?? "",
  );
  const [amountDisplay, setAmountDisplay] = useState(
    formatRupiahInput(transaction.amount.toString()),
  );
  const [noteText, setNoteText] = useState(transaction.note ?? "");

  const isTransfer = type === "transfer";
  const isAdjustment = type === "adjustment";
  const needsCategory = !isTransfer && !isAdjustment;
  const isNegativeAdjustment = isAdjustment && transaction.amount < 0;

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const categoryOptions = useMemo(
    () => filteredCategories.map((c) => ({ value: c.id, label: c.name })),
    [filteredCategories],
  );

  const walletOptions = useMemo(
    () => wallets.map((w) => ({ value: w.id, label: w.name })),
    [wallets],
  );

  // Dompet tujuan tidak boleh sama dengan dompet asal
  const destinationOptions = useMemo(
    () => wallets.filter((w) => w.id !== walletId).map((w) => ({ value: w.id, label: w.name })),
    [wallets, walletId],
  );

  const effectiveDestination =
    destinationWalletId && destinationWalletId !== walletId
      ? destinationWalletId
      : (destinationOptions[0]?.value ?? "");

  /* ─── Validasi ringan di sisi client (server tetap memvalidasi ulang) ─── */
  const amountDigits = amountDisplay.replace(isAdjustment ? /[^\d-]/g : /\D/g, "");
  const amountValue = Number(amountDigits);
  const hasAmount = Number.isFinite(amountValue) && amountValue > 0;

  let missingHint: string | null = null;
  if (!isNegativeAdjustment) {
    if (!hasAmount) missingHint = "Isi nominal dulu";
    else if (!walletId) missingHint = "Pilih dompet dulu";
    else if (needsCategory && !categoryId) missingHint = "Pilih kategori dulu";
    else if (isTransfer && !effectiveDestination) missingHint = "Pilih dompet tujuan dulu";
  }
  const canSubmit = !isNegativeAdjustment && !missingHint;
  // Alasan kenapa tombol belum aktif ditampilkan langsung di tombolnya (tanpa baris tambahan)
  const submitLabel = missingHint ?? "Simpan perubahan";

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
        ? "bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-500"
        : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500";

  const capsuleColor =
    type === "expense"
      ? "bg-rose-700"
      : type === "income"
        ? "bg-emerald-700"
        : "bg-blue-500";

  const dateField = (
    <Field label="Tanggal">
      <DateInput
        name="transaction_date"
        defaultValue={transaction.transaction_date}
        className="input-base w-full"
        required
      />
    </Field>
  );

  return (
    <div className="mt-4 space-y-3 pb-24 lg:pb-0">
      <div className="section-card p-4 sm:p-5">
        <form action={action} className="transaction-entry space-y-5">
          <input type="hidden" name="id" value={transaction.id} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="wallet_id" value={walletId} />
          {isTransfer && (
            <input type="hidden" name="destination_wallet_id" value={effectiveDestination} />
          )}
          {needsCategory && <input type="hidden" name="category_id" value={categoryId} />}
          <input type="hidden" name="amount" value={amountDigits} />

          {/* ── 1. Jenis transaksi ── */}
          {!isAdjustment ? (
            <div className="relative rounded-2xl bg-slate-100/80 p-1 ring-1 ring-black/5 dark:bg-slate-800/70 dark:ring-white/5">
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(33.333%-2px)] rounded-xl shadow-sm ${capsuleColor} transition-transform duration-300 ease-out`}
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
                    aria-pressed={type === id}
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
                    <Icon size={14} className="hidden shrink-0 sm:block sm:size-4" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 ring-1 ring-black/5 dark:bg-slate-800/60 dark:ring-white/5">
              <Settings2 size={18} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Penyesuaian saldo · tipe tetap
              </span>
            </div>
          )}

          {/* ── 2. Nominal ── */}
          <div className="flex flex-col items-center justify-center py-1">
            <label
              htmlFor="edit-amount"
              className="mb-1 text-xs font-semibold"
              style={{ color: "var(--lk-text-muted)" }}
            >
              Nominal
            </label>
            <div className="flex max-w-full items-baseline justify-center gap-1.5 px-4">
              <span className={`text-xl font-extrabold ${accentText} transition-colors duration-300`}>
                Rp
              </span>
              <input
                id="edit-amount"
                type="text"
                inputMode="numeric"
                readOnly={isNegativeAdjustment}
                placeholder="0"
                value={amountDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setAmountDisplay(formatRupiahInput(raw));
                }}
                // Lebar mengikuti jumlah digit supaya angka besar tidak terpotong
                style={{ width: `${Math.max(amountDisplay.length, 1) + 0.5}ch`, maxWidth: "70vw" }}
                className={`min-w-0 border-none bg-transparent p-0 text-left text-4xl font-extrabold tabular-nums outline-none focus:ring-0 ${accentText} ${accentPlaceholder} transition-colors duration-300`}
                required
              />
            </div>
          </div>

          {isNegativeAdjustment && (
            <p className="ui-alert">
              Transaksi koreksi negatif belum dapat disimpan melalui formulir ini. Tanda minus
              dipertahankan. Gunakan Koreksi Saldo di halaman Dompet untuk penyesuaian baru.
            </p>
          )}

          {/* ── 3. Detail ── */}
          <div className="space-y-4">
            {isTransfer ? (
              <>
                {dateField}
                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <Field label="Dari dompet" htmlFor="edit-wallet">
                    <FilterSelect
                      id="edit-wallet"
                      variant="field"
                      label="Dari dompet"
                      value={walletId}
                      options={walletOptions}
                      placeholder="Pilih dompet"
                      onChange={setWalletId}
                    />
                  </Field>
                  <Field label="Ke dompet" htmlFor="edit-destination">
                    <FilterSelect
                      id="edit-destination"
                      variant="field"
                      label="Ke dompet"
                      value={effectiveDestination}
                      options={destinationOptions}
                      placeholder="Pilih dompet"
                      onChange={setDestinationWalletId}
                    />
                  </Field>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                {dateField}
                <Field label="Dompet" htmlFor="edit-wallet">
                  <FilterSelect
                    id="edit-wallet"
                    variant="field"
                    label="Dompet"
                    value={walletId}
                    options={walletOptions}
                    placeholder="Pilih dompet"
                    onChange={setWalletId}
                  />
                </Field>
              </div>
            )}

            {needsCategory && (
              <Field label="Kategori" htmlFor="edit-category">
                <FilterSelect
                  id="edit-category"
                  variant="field"
                  label="Kategori"
                  value={categoryId}
                  options={categoryOptions}
                  placeholder="Pilih kategori"
                  searchable
                  onChange={setCategoryId}
                />
              </Field>
            )}

            <Field
              label="Catatan (opsional)"
              htmlFor="edit-note"
              hint={
                <span
                  className={`text-[11px] font-semibold tabular-nums transition-colors ${
                    noteText.length >= NOTE_MAX_LENGTH * 0.9 ? "text-rose-500" : "text-slate-400"
                  }`}
                >
                  {noteText.length}/{NOTE_MAX_LENGTH}
                </span>
              }
            >
              <textarea
                id="edit-note"
                name="note"
                rows={3}
                placeholder="Contoh: makan siang, bayar tagihan"
                maxLength={NOTE_MAX_LENGTH}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="input-base textarea-base resize-none text-base"
              />
            </Field>
          </div>

          {/* ── 4. Aksi utama: satu baris, menempel di atas bottom nav saat scroll di mobile ── */}
          <div
            className="sticky bottom-24 z-20 -mx-4 flex items-center gap-2 border-t px-4 pb-3 pt-3 backdrop-blur sm:-mx-5 sm:px-5 lg:static lg:mx-0 lg:border-t-0 lg:px-0 lg:pb-0"
            style={{
              borderColor: "var(--lk-border)",
              background: "color-mix(in srgb, var(--lk-surface) 92%, transparent)",
            }}
          >
            <TransactionReturnLink className="inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-3 text-base font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              Batal
            </TransactionReturnLink>
            <SubmitButton
              className={`flex-1 rounded-xl py-3 text-base font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[color:var(--lk-surface-raised)] disabled:text-[color:var(--lk-text-faint)] disabled:shadow-none ${submitCls}`}
              disabled={!canSubmit}
              pendingText="Menyimpan..."
            >
              {submitLabel}
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* ── 5. Aksi lain: dua tombol sama besar, dipisah dari aksi utama ── */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/transactions/new?duplicateId=${encodeURIComponent(transaction.id)}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors"
          style={{
            borderColor: "var(--lk-border)",
            background: "var(--lk-surface)",
            color: "var(--lk-text)",
          }}
        >
          <Copy size={15} />
          Duplikat
        </Link>
        <DeleteTransactionButton
          id={transaction.id}
          action={deleteAction}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100/70 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/20"
          label="Hapus"
        />
      </div>
    </div>
  );
}
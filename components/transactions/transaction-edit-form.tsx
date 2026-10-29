"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Copy,
  Settings2,
  RotateCcw,
} from "lucide-react";
import { TransactionReturnLink } from "@/components/transactions/transaction-list-context";
import FilterSelect from "@/components/transactions/filter-select";
import DateInput from "@/components/ui/date-input";
import SubmitButton from "@/components/ui/submit-button";
import DeleteTransactionButton from "@/components/transactions/delete-transaction-button";
import { getCategoryVisuals } from "@/lib/utils/icons";

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

const TYPE_CONFIG = {
  expense: {
    label: "Pengeluaran",
    Icon: ArrowDownLeft,
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40",
    capsule: "bg-rose-600 dark:bg-rose-600 text-white shadow-sm",
    amountColor: "text-rose-600 dark:text-rose-400",
    placeholderColor: "placeholder:text-rose-300/40 dark:placeholder:text-rose-800/30",
    prefix: "-",
    submitClass: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-600/20",
    chipSelected:
      "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  },
  income: {
    label: "Pemasukan",
    Icon: ArrowUpRight,
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40",
    capsule: "bg-emerald-600 dark:bg-emerald-600 text-white shadow-sm",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    placeholderColor: "placeholder:text-emerald-300/40 dark:placeholder:text-emerald-800/30",
    prefix: "+",
    submitClass: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20",
    chipSelected:
      "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  transfer: {
    label: "Transfer",
    Icon: ArrowLeftRight,
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40",
    capsule: "bg-blue-600 dark:bg-blue-600 text-white shadow-sm",
    amountColor: "text-blue-600 dark:text-blue-400",
    placeholderColor: "placeholder:text-blue-300/40 dark:placeholder:text-blue-800/30",
    prefix: "⇄",
    submitClass: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/20",
    chipSelected:
      "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  adjustment: {
    label: "Penyesuaian",
    Icon: Settings2,
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40",
    capsule: "bg-amber-600 dark:bg-amber-600 text-white shadow-sm",
    amountColor: "text-amber-600 dark:text-amber-400",
    placeholderColor: "placeholder:text-amber-300/40 dark:placeholder:text-amber-800/30",
    prefix: "±",
    submitClass: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-600/20",
    chipSelected:
      "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
} as const;

const QUICK_AMOUNTS = [
  { label: "+10rb", value: 10000 },
  { label: "+20rb", value: 20000 },
  { label: "+50rb", value: 50000 },
  { label: "+100rb", value: 100000 },
  { label: "+500rb", value: 500000 },
];

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
      <div className="mb-1.5 flex h-7 items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold leading-none"
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
    formatRupiahInput(Math.abs(transaction.amount).toString()),
  );
  const [transactionDate, setTransactionDate] = useState(transaction.transaction_date);
  const [noteText, setNoteText] = useState(transaction.note ?? "");
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const isTransfer = type === "transfer";
  const isAdjustment = type === "adjustment";
  const needsCategory = !isTransfer && !isAdjustment;
  const isNegativeAdjustment = isAdjustment && transaction.amount < 0;

  const cfg = TYPE_CONFIG[type];

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

  const destinationOptions = useMemo(
    () => wallets.filter((w) => w.id !== walletId).map((w) => ({ value: w.id, label: w.name })),
    [wallets, walletId],
  );

  const effectiveDestination =
    destinationWalletId && destinationWalletId !== walletId
      ? destinationWalletId
      : (destinationOptions[0]?.value ?? "");

  /* ─── Validasi ringan di sisi client ─── */
  const amountDigits = amountDisplay.replace(isAdjustment ? /[^\d-]/g : /\D/g, "");
  const amountValue = Number(amountDigits);
  const hasAmount = Number.isFinite(amountValue) && amountValue > 0;

  let missingHint: string | null = null;
  if (!hasAmount) missingHint = "Isi nominal dulu";
  else if (!walletId) missingHint = "Pilih dompet dulu";
  else if (needsCategory && !categoryId) missingHint = "Pilih kategori dulu";
  else if (isTransfer && !effectiveDestination) missingHint = "Pilih dompet tujuan dulu";
  const canSubmit = !missingHint;
  const submitLabel = missingHint ?? "Simpan Perubahan";

  const setDateOffset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setTransactionDate(`${yyyy}-${mm}-${dd}`);
  };

  const getDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const isToday = transactionDate === getDateStr(0);
  const isYesterday = transactionDate === getDateStr(1);

  const handleAddAmount = (addVal: number) => {
    const current = Number(amountDisplay.replace(/\D/g, "")) || 0;
    const next = current + addVal;
    setAmountDisplay(formatRupiahInput(String(next)));
  };

  const handleClearAmount = () => {
    setAmountDisplay("");
    amountInputRef.current?.focus();
  };

  return (
    <div className="mt-4 space-y-4 pb-20 lg:pb-0">
      <form action={action} className="transaction-entry space-y-4">
        <input type="hidden" name="id" value={transaction.id} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="wallet_id" value={walletId} />
        {isTransfer && (
          <input type="hidden" name="destination_wallet_id" value={effectiveDestination} />
        )}
        {needsCategory && <input type="hidden" name="category_id" value={categoryId} />}
        <input
          type="hidden"
          name="amount"
          value={isNegativeAdjustment ? String(-Math.abs(amountValue)) : amountDigits}
        />

        {/* ── CARD 1: HERO AMOUNT & TYPE SWITCHER ── */}
        <div
          className="rounded-2xl border p-4 sm:p-6 shadow-sm transition-all"
          style={{
            backgroundColor: "var(--lk-surface)",
            borderColor: "var(--lk-border)",
          }}
        >
          {/* Segmented Type Switcher */}
          {!isAdjustment ? (
            <div
              className="relative rounded-2xl p-1 border transition-colors mb-5"
              style={{
                backgroundColor: "var(--lk-surface-raised)",
                borderColor: "var(--lk-border)",
              }}
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(33.333%-2px)] rounded-xl ${cfg.capsule} transition-transform duration-200 ease-out`}
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
                ).map(({ id, label, Icon }) => {
                  const isSelected = type === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        const hasMatchingCat = categories.some(
                          (item) => item.type === id && item.id === categoryId,
                        );
                        setType(id);
                        if (!hasMatchingCat) setCategoryId("");
                      }}
                      className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-colors duration-150 ${isSelected
                          ? "text-white font-bold"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-5">
              <Settings2 size={18} className="text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Penyesuaian saldo · tipe transaksi tidak dapat diubah
              </span>
            </div>
          )}

          {/* Amount Box */}
          <div
            className="rounded-2xl border p-4 sm:p-5 transition-all text-center"
            style={{
              backgroundColor: "var(--lk-surface-raised)",
              borderColor: "var(--lk-border)",
            }}
            onClick={() => amountInputRef.current?.focus()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Nominal Transaksi
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 py-2 cursor-text overflow-hidden">
              <span className={`text-base sm:text-xl font-bold ${cfg.amountColor} select-none shrink-0 self-center`}>
                {isAdjustment ? (isNegativeAdjustment ? "-" : "+") : cfg.prefix} Rp
              </span>
              <input
                id="edit-amount"
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setAmountDisplay(formatRupiahInput(raw));
                }}
                style={{
                  width: `${Math.max(amountDisplay.length, 1) + 0.3}ch`,
                  maxWidth: "65vw",
                }}
                className={`amount-hero-input min-w-0 border-none bg-transparent p-0 text-left font-extrabold tabular-nums outline-none focus:outline-none focus:ring-0 transition-colors duration-200 ${cfg.amountColor} ${cfg.placeholderColor}`}
                required
              />
            </div>

            {/* Quick Amount Steppers + Frozen Reset button (if not negative adjustment) */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-1.5">
                <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {QUICK_AMOUNTS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAmount(preset.value);
                      }}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 transition-all"
                      style={{ minHeight: "32px" }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {hasAmount && (
                  <div className="flex items-center gap-1.5 shrink-0 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearAmount();
                      }}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all"
                      style={{ minHeight: "32px" }}
                      title="Reset nominal"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
              </div>
            )}
          </div>

        </div>

        {/* ── CARD 2: DETAIL TRANSAKSI ── */}
        <div
          className="rounded-2xl border p-4 sm:p-6 shadow-sm space-y-4"
          style={{
            backgroundColor: "var(--lk-surface)",
            borderColor: "var(--lk-border)",
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--lk-text-faint)" }}>
            Detail Transaksi
          </h3>

          {/* Transfer vs Regular Flow */}
          {isTransfer ? (
            <div className="space-y-4">
              <div
                className="rounded-xl border p-3.5 space-y-3"
                style={{
                  backgroundColor: "var(--lk-surface-raised)",
                  borderColor: "var(--lk-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <ArrowLeftRight size={13} />
                    <span>Arah Pemindahan Saldo</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <Field label="Dari Dompet (Sumber)" htmlFor="edit-wallet">
                    <FilterSelect
                      id="edit-wallet"
                      variant="field"
                      label="Dari dompet"
                      value={walletId}
                      options={walletOptions}
                      placeholder="Pilih dompet asal"
                      onChange={setWalletId}
                    />
                  </Field>
                  <Field label="Ke Dompet (Tujuan)" htmlFor="edit-destination">
                    <FilterSelect
                      id="edit-destination"
                      variant="field"
                      label="Ke dompet"
                      value={effectiveDestination}
                      options={destinationOptions}
                      placeholder="Pilih dompet tujuan"
                      onChange={setDestinationWalletId}
                    />
                  </Field>
                </div>
              </div>

              <Field
                label="Tanggal Transaksi"
                htmlFor="edit-transfer-date"
                hint={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDateOffset(0)}
                      className={`text-[11px] px-1 py-0.5 transition-colors ${isToday
                          ? "font-bold text-teal-600 dark:text-teal-400"
                          : "font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        }`}
                    >
                      Hari ini
                    </button>
                    <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
                    <button
                      type="button"
                      onClick={() => setDateOffset(1)}
                      className={`text-[11px] px-1 py-0.5 transition-colors ${isYesterday
                          ? "font-bold text-teal-600 dark:text-teal-400"
                          : "font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        }`}
                    >
                      Kemarin
                    </button>
                  </div>
                }
              >
                <DateInput
                  id="edit-transfer-date"
                  name="transaction_date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="input-base w-full h-11"
                  required
                />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <Field
                label="Tanggal Transaksi"
                htmlFor="edit-date"
                hint={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDateOffset(0)}
                      className={`text-[11px] leading-none px-1 py-0.5 transition-colors ${isToday
                          ? "font-bold text-teal-600 dark:text-teal-400"
                          : "font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        }`}
                    >
                      Hari ini
                    </button>
                    <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
                    <button
                      type="button"
                      onClick={() => setDateOffset(1)}
                      className={`text-[11px] leading-none px-1 py-0.5 transition-colors ${isYesterday
                          ? "font-bold text-teal-600 dark:text-teal-400"
                          : "font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        }`}
                    >
                      Kemarin
                    </button>
                  </div>
                }
              >
                <DateInput
                  id="edit-date"
                  name="transaction_date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="input-base w-full h-11"
                  required
                />
              </Field>

              <Field label="Dompet" htmlFor="edit-wallet">
                <FilterSelect
                  id="edit-wallet"
                  variant="field"
                  label="Dompet"
                  value={walletId}
                  options={walletOptions}
                  placeholder="Pilih dompet"
                  onChange={setWalletId}
                  className="h-11"
                />
              </Field>
            </div>
          )}

          {/* Kategori */}
          {needsCategory && (
            <div className="pt-1 space-y-2.5">
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

              {/* Quick Category Chips */}
              {filteredCategories.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--lk-text-faint)" }}>
                    Pilihan cepat:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredCategories.slice(0, 6).map((c) => {
                      const visuals = getCategoryVisuals(c.name, c.type);
                      const isSelected = categoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategoryId(c.id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 border ${isSelected
                              ? `${cfg.chipSelected} shadow-xs font-bold ring-2 ring-current/20`
                              : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/80"
                            }`}
                          style={{ minHeight: "34px" }}
                        >
                          <span className="scale-90 shrink-0">{visuals.icon}</span>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Catatan */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <Field
              label="Catatan (Opsional)"
              htmlFor="edit-note"
              hint={
                <span
                  className={`text-[11px] font-semibold tabular-nums transition-colors ${noteText.length >= NOTE_MAX_LENGTH * 0.9 ? "text-rose-500" : "text-slate-400"
                    }`}
                >
                  {noteText.length}/{NOTE_MAX_LENGTH}
                </span>
              }
            >
              <textarea
                id="edit-note"
                name="note"
                rows={2}
                placeholder="Contoh: makan siang, bayar tagihan..."
                maxLength={NOTE_MAX_LENGTH}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="input-base textarea-base w-full resize-none text-sm sm:text-base leading-relaxed"
              />
            </Field>
          </div>
        </div>

        {/* ── ACTION BUTTONS: RELAYOUT FOR MOBILE & DESKTOP ── */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Submit Button */}
          <SubmitButton
            className={`w-full rounded-2xl py-3.5 px-4 text-sm sm:text-base font-bold shadow-md transition-all duration-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:bg-[color:var(--lk-surface-raised)] disabled:text-[color:var(--lk-text-faint)] disabled:shadow-none ${cfg.submitClass}`}
            disabled={!canSubmit}
            pendingText="Menyimpan perubahan..."
          >
            {canSubmit ? (
              <span className="flex items-center justify-center gap-2">
                <span>Simpan Perubahan</span>
                <span className="font-mono text-xs sm:text-sm opacity-90 font-medium">
                  ({cfg.prefix}Rp {amountDisplay})
                </span>
              </span>
            ) : (
              submitLabel
            )}
          </SubmitButton>

          {/* Secondary Actions Grid (Batal, Duplikat, Hapus) */}
          <div className="grid grid-cols-3 gap-2">
            <TransactionReturnLink
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{
                borderColor: "var(--lk-border)",
                color: "var(--lk-text-muted)",
                backgroundColor: "var(--lk-surface)",
              }}
            >
              Batal
            </TransactionReturnLink>

            <Link
              href={`/transactions/new?duplicateId=${encodeURIComponent(transaction.id)}`}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60"
              style={{
                borderColor: "var(--lk-border)",
                background: "var(--lk-surface)",
                color: "var(--lk-text)",
              }}
            >
              <Copy size={15} />
              <span>Duplikat</span>
            </Link>

            <DeleteTransactionButton
              id={transaction.id}
              action={deleteAction}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs sm:text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100/70 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/20"
              label="Hapus"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
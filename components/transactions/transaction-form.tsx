"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Info, Plus, RotateCcw } from "lucide-react";
import FilterSelect from "@/components/transactions/filter-select";
import DateInput from "@/components/ui/date-input";
import SubmitButton from "@/components/ui/submit-button";
import { getCategoryVisuals } from "@/lib/utils/icons";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type WalletItem = {
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
  wallets: WalletItem[];
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
} as const;

const TYPE_ORDER = ["expense", "income", "transfer"] as const;

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

export default function TransactionForm({
  categories,
  wallets,
  defaultDate,
  action,
  initialValues,
  infoMessage,
  recentCategories = [],
}: TransactionFormProps) {
  const defaultType =
    initialValues?.type === "income" ||
    initialValues?.type === "expense" ||
    initialValues?.type === "transfer"
      ? initialValues.type
      : "expense";

  const [type, setType] = useState<"income" | "expense" | "transfer">(defaultType);
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [walletId, setWalletId] = useState(
    initialValues?.walletId ?? (wallets[0]?.id ?? ""),
  );
  const [destinationWalletId, setDestinationWalletId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState(
    initialValues?.amountIDR ? formatRupiahInput(String(initialValues.amountIDR)) : "",
  );
  const [transactionDate, setTransactionDate] = useState(defaultDate);
  const [noteText, setNoteText] = useState(initialValues?.note ?? "");
  const [showNote, setShowNote] = useState(!!initialValues?.note);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const cfg = TYPE_CONFIG[type];
  const isTransfer = type === "transfer";
  const needsCategory = !isTransfer;

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

  const recentCategoryChips = useMemo(() => {
    const allowedIds = new Set(filteredCategories.map((c) => c.id));
    return recentCategories
      .filter((c) => c.type === type && allowedIds.has(c.id))
      .slice(0, 6);
  }, [filteredCategories, recentCategories, type]);

  /* ─── Validasi di sisi client ─── */
  const amountDigits = amountDisplay.replace(/\D/g, "");
  const hasAmount = Number(amountDigits) > 0;

  let missingHint: string | null = null;
  if (!hasAmount) missingHint = "Isi nominal dulu";
  else if (!walletId) missingHint = "Pilih dompet dulu";
  else if (needsCategory && !categoryId) missingHint = "Pilih kategori dulu";
  else if (isTransfer && !effectiveDestination) missingHint = "Pilih dompet tujuan dulu";

  const canSubmit = !missingHint;
  const submitLabel = missingHint ?? "Simpan transaksi";

  const setDateOffset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setTransactionDate(`${yyyy}-${mm}-${dd}`);
  };

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
    <form action={action} className="transaction-entry space-y-4 pb-16 lg:pb-4">
      {infoMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-teal-200/60 bg-teal-50/60 px-4 py-3 text-sm text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
          <Info size={15} className="mt-0.5 shrink-0" />
          {infoMessage}
        </div>
      )}

      {/* Hidden inputs for form submit */}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="wallet_id" value={walletId} />
      {isTransfer && (
        <input type="hidden" name="destination_wallet_id" value={effectiveDestination} />
      )}
      {needsCategory && <input type="hidden" name="category_id" value={categoryId} />}
      <input type="hidden" name="amount" value={amountDigits} />

      {/* ── CARD 1: HERO AMOUNT & TYPE SWITCHER ── */}
      <div
        className="rounded-2xl border p-4 sm:p-6 shadow-sm transition-all"
        style={{
          backgroundColor: "var(--lk-surface)",
          borderColor: "var(--lk-border)",
        }}
      >
        {/* Segmented Type Switcher */}
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
            {TYPE_ORDER.map((t) => {
              const c = TYPE_CONFIG[t];
              const Icon = c.Icon;
              const isSelected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setType(t);
                    setCategoryId("");
                  }}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                    isSelected
                      ? "text-white font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input Box */}
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
            <span className={`text-2xl sm:text-3xl font-extrabold ${cfg.amountColor} select-none shrink-0`}>
              {cfg.prefix} Rp
            </span>
            <input
              id="new-amount"
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
              className={`min-w-0 border-none bg-transparent p-0 text-left text-4xl sm:text-5xl font-black tabular-nums outline-none focus:outline-none focus:ring-0 transition-colors duration-200 ${cfg.amountColor} ${cfg.placeholderColor}`}
              required
            />
          </div>

          {/* Quick Amount Stepper Chips */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-0">
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAmount();
                }}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md transition-colors"
                style={{ minHeight: "32px" }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
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

        {/* Transfer vs Non-Transfer Wallet & Date */}
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
                <Field label="Dari Dompet (Sumber)" htmlFor="new-wallet">
                  <FilterSelect
                    id="new-wallet"
                    variant="field"
                    label="Dari dompet"
                    value={walletId}
                    options={walletOptions}
                    placeholder="Pilih dompet asal"
                    onChange={setWalletId}
                  />
                </Field>
                <Field label="Ke Dompet (Tujuan)" htmlFor="new-destination">
                  <FilterSelect
                    id="new-destination"
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

            {/* Tanggal untuk transfer */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="new-date" className="text-xs font-semibold" style={{ color: "var(--lk-text-muted)" }}>
                  Tanggal Transaksi
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDateOffset(0)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                  >
                    Hari ini
                  </button>
                  <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
                  <button
                    type="button"
                    onClick={() => setDateOffset(1)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
              <DateInput
                name="transaction_date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="input-base w-full"
                required
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="new-date" className="text-xs font-semibold" style={{ color: "var(--lk-text-muted)" }}>
                  Tanggal Transaksi
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDateOffset(0)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                  >
                    Hari ini
                  </button>
                  <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
                  <button
                    type="button"
                    onClick={() => setDateOffset(1)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
              <DateInput
                name="transaction_date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="input-base w-full"
                required
              />
            </div>

            <Field label="Dompet Sumber" htmlFor="new-wallet">
              <FilterSelect
                id="new-wallet"
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

        {/* Kategori Section (Non-Transfer) */}
        {needsCategory && (
          <div className="pt-1 space-y-2.5">
            <Field label="Kategori" htmlFor="new-category">
              <FilterSelect
                id="new-category"
                variant="field"
                label="Kategori"
                value={categoryId}
                options={categoryOptions}
                placeholder="Pilih kategori"
                searchable
                onChange={setCategoryId}
              />
            </Field>

            {/* Quick Category Chips with Icons */}
            {recentCategoryChips.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--lk-text-faint)" }}>
                  Sering dipakai:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentCategoryChips.map((c) => {
                    const visuals = getCategoryVisuals(c.name, type);
                    const isSelected = categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 border ${
                          isSelected
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

        {/* Catatan / Keterangan */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {showNote ? (
            <Field
              label="Catatan (Opsional)"
              htmlFor="new-note"
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
                id="new-note"
                ref={noteRef}
                name="note"
                rows={2}
                placeholder="Contoh: makan siang nasi padang, bensin, tiket bioskop..."
                maxLength={NOTE_MAX_LENGTH}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="input-base textarea-base w-full resize-none text-sm sm:text-base leading-relaxed"
              />
            </Field>
          ) : (
            <div className="flex items-center justify-between">
              <input type="hidden" name="note" value="" />
              <button
                type="button"
                onClick={() => {
                  setShowNote(true);
                  requestAnimationFrame(() => noteRef.current?.focus());
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors"
                style={{ color: "var(--lk-primary)" }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--lk-primary-dim)" }}
                >
                  <Plus size={14} />
                </div>
                <span>Tambah Catatan Keterangan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SUBMIT ACTION BUTTON ── */}
      <div className="pt-1">
        <SubmitButton
          className={`w-full rounded-2xl py-3.5 px-4 text-sm sm:text-base font-bold shadow-md transition-all duration-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:bg-[color:var(--lk-surface-raised)] disabled:text-[color:var(--lk-text-faint)] disabled:shadow-none ${cfg.submitClass}`}
          disabled={!canSubmit}
          pendingText="Menyimpan transaksi..."
        >
          {canSubmit ? (
            <span className="flex items-center justify-center gap-2">
              <span>
                {type === "expense"
                  ? "Catat Pengeluaran"
                  : type === "income"
                  ? "Catat Pemasukan"
                  : "Kirim Transfer"}
              </span>
              <span className="font-mono text-xs sm:text-sm opacity-90 font-medium">
                ({cfg.prefix}Rp {amountDisplay})
              </span>
            </span>
          ) : (
            submitLabel
          )}
        </SubmitButton>
      </div>
    </form>
  );
}
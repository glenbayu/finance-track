"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Info, Plus } from "lucide-react";
import FilterSelect from "@/components/transactions/filter-select";
import DateInput from "@/components/ui/date-input";
import SubmitButton from "@/components/ui/submit-button";

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
    capsule: "bg-rose-700",
    amountColor: "text-rose-600 dark:text-rose-400",
    placeholderColor: "placeholder:text-rose-300/40 dark:placeholder:text-rose-700/20",
    submitClass: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500",
    chipSelected:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  },
  income: {
    label: "Pemasukan",
    Icon: ArrowUpRight,
    capsule: "bg-emerald-700",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    placeholderColor: "placeholder:text-emerald-300/40 dark:placeholder:text-emerald-700/20",
    submitClass: "bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-500",
    chipSelected:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  transfer: {
    label: "Transfer",
    Icon: ArrowLeftRight,
    capsule: "bg-blue-500",
    amountColor: "text-blue-600 dark:text-blue-400",
    placeholderColor: "placeholder:text-blue-300/40 dark:placeholder:text-blue-700/20",
    submitClass: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
    chipSelected:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
} as const;

const TYPE_ORDER = ["expense", "income", "transfer"] as const;

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
  const [noteText, setNoteText] = useState(initialValues?.note ?? "");
  const [showNote, setShowNote] = useState(!!initialValues?.note);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

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

  /* ─── Validasi ringan di sisi client (server tetap memvalidasi ulang) ─── */
  const amountDigits = amountDisplay.replace(/\D/g, "");
  const hasAmount = Number(amountDigits) > 0;

  let missingHint: string | null = null;
  if (!hasAmount) missingHint = "Isi nominal dulu";
  else if (!walletId) missingHint = "Pilih dompet dulu";
  else if (needsCategory && !categoryId) missingHint = "Pilih kategori dulu";
  else if (isTransfer && !effectiveDestination) missingHint = "Pilih dompet tujuan dulu";

  const canSubmit = !missingHint;
  // Alasan kenapa tombol belum aktif ditampilkan langsung di tombolnya
  const submitLabel = missingHint ?? "Simpan transaksi";

  const dateField = (
    <Field label="Tanggal">
      <DateInput
        name="transaction_date"
        defaultValue={defaultDate}
        className="input-base w-full"
        required
      />
    </Field>
  );

  return (
    <form action={action} className="transaction-entry space-y-4 pb-24 lg:pb-0">
      {infoMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-teal-200/60 bg-teal-50/60 px-4 py-3 text-sm text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
          <Info size={15} className="mt-0.5 shrink-0" />
          {infoMessage}
        </div>
      )}

      <div className="section-card space-y-5 p-4 sm:p-5">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="wallet_id" value={walletId} />
        {isTransfer && (
          <input type="hidden" name="destination_wallet_id" value={effectiveDestination} />
        )}
        {needsCategory && <input type="hidden" name="category_id" value={categoryId} />}
        <input type="hidden" name="amount" value={amountDigits} />

        {/* ── 1. Jenis transaksi ── */}
        <div className="relative rounded-2xl bg-slate-100/80 p-1 ring-1 ring-black/5 dark:bg-slate-800/70 dark:ring-white/5">
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(33.333%-2px)] rounded-xl shadow-sm ${cfg.capsule} transition-transform duration-300 ease-out`}
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
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={type === t}
                  onClick={() => {
                    setType(t);
                    setCategoryId("");
                  }}
                  className={`relative z-10 flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors duration-200 sm:gap-1.5 sm:text-sm ${
                    type === t
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} className="hidden shrink-0 sm:block sm:size-4" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Nominal ── */}
        <div className="flex flex-col items-center justify-center py-1">
          <label
            htmlFor="new-amount"
            className="mb-1 text-xs font-semibold"
            style={{ color: "var(--lk-text-muted)" }}
          >
            Nominal
          </label>
          <div className="amount-wrap flex max-w-full items-baseline justify-center gap-1.5 px-4">
            <span className={`text-xl font-extrabold transition-colors duration-200 ${cfg.amountColor}`}>
              Rp
            </span>
            <input
              id="new-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setAmountDisplay(formatRupiahInput(raw));
              }}
              // Lebar mengikuti jumlah digit supaya angka besar tidak terpotong
              style={{ width: `${Math.max(amountDisplay.length, 1) + 0.5}ch`, maxWidth: "70vw" }}
              className={`amount-input min-w-0 border-none bg-transparent p-0 text-left text-4xl font-extrabold tabular-nums outline-none focus:border-none focus:outline-none focus:ring-0 transition-colors duration-200 ${cfg.amountColor} ${cfg.placeholderColor}`}
              required
            />
          </div>
        </div>

        {/* ── 3. Detail ── */}
        <div className="space-y-4">
          {isTransfer ? (
            <>
              {dateField}
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <Field label="Dari dompet" htmlFor="new-wallet">
                  <FilterSelect
                    id="new-wallet"
                    variant="field"
                    label="Dari dompet"
                    value={walletId}
                    options={walletOptions}
                    placeholder="Pilih dompet"
                    onChange={setWalletId}
                  />
                </Field>
                <Field label="Ke dompet" htmlFor="new-destination">
                  <FilterSelect
                    id="new-destination"
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
              <Field label="Dompet" htmlFor="new-wallet">
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

          {needsCategory && (
            <div>
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
              {recentCategoryChips.length > 0 && (
                <div className="category-chips mt-2 flex flex-wrap gap-1.5">
                  {recentCategoryChips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        categoryId === c.id
                          ? cfg.chipSelected
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showNote ? (
            <Field
              label="Catatan (opsional)"
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
                placeholder="Contoh: makan siang, tiket bioskop"
                maxLength={NOTE_MAX_LENGTH}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="input-base textarea-base w-full resize-none text-base"
              />
            </Field>
          ) : (
            <>
              <input type="hidden" name="note" value="" />
              <button
                type="button"
                onClick={() => {
                  setShowNote(true);
                  // Fokus hanya saat user sendiri yang membuka catatan
                  requestAnimationFrame(() => noteRef.current?.focus());
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--lk-primary)" }}
              >
                <Plus size={14} />
                Tambah catatan
              </button>
            </>
          )}
        </div>

        {/* ── 4. Simpan: menempel di atas bottom nav saat scroll di mobile ── */}
        <div
          className="sticky bottom-24 z-20 -mx-4 border-t px-4 pb-3 pt-3 backdrop-blur sm:-mx-5 sm:px-5 lg:static lg:mx-0 lg:border-t-0 lg:px-0 lg:pb-0"
          style={{
            borderColor: "var(--lk-border)",
            background: "color-mix(in srgb, var(--lk-surface) 92%, transparent)",
          }}
        >
          <SubmitButton
            className={`w-full rounded-xl py-3 text-base font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[color:var(--lk-surface-raised)] disabled:text-[color:var(--lk-text-faint)] disabled:shadow-none ${cfg.submitClass}`}
            disabled={!canSubmit}
            pendingText="Menyimpan..."
          >
            {submitLabel}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
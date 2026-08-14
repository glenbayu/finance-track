"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  CalendarDays,
  Wallet,
  Tag,
  FileText,
} from "lucide-react";
import FormSelect from "@/components/ui/form-select";
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
    accentHex: "#e11d48",
    amountColor: "text-rose-600 dark:text-rose-400",
    placeholderColor: "placeholder:text-rose-200 dark:placeholder:text-rose-800/40",
    submitClass: "bg-rose-600 hover:bg-rose-700",
    chipSelected:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  },
  income: {
    label: "Pemasukan",
    Icon: ArrowUpRight,
    accentHex: "#059669",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    placeholderColor:
      "placeholder:text-emerald-200 dark:placeholder:text-emerald-800/40",
    submitClass: "bg-emerald-600 hover:bg-emerald-700",
    chipSelected:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  transfer: {
    label: "Transfer",
    Icon: ArrowLeftRight,
    accentHex: "#2563eb",
    amountColor: "text-blue-600 dark:text-blue-400",
    placeholderColor: "placeholder:text-blue-200 dark:placeholder:text-blue-800/40",
    submitClass: "bg-blue-600 hover:bg-blue-700",
    chipSelected:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
} as const;

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
  const [destinationWalletId, setDestinationWalletId] = useState(
    wallets.length > 1 ? wallets[1].id : "",
  );
  const [amountDisplay, setAmountDisplay] = useState(
    initialValues?.amountIDR ? formatRupiahInput(String(initialValues.amountIDR)) : "",
  );
  const [noteText, setNoteText] = useState(initialValues?.note ?? "");
  const [showNote, setShowNote] = useState(!!initialValues?.note);

  const cfg = TYPE_CONFIG[type];

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const recentCategoryChips = useMemo(() => {
    const allowedIds = new Set(filteredCategories.map((c) => c.id));
    return recentCategories
      .filter((c) => c.type === type && allowedIds.has(c.id))
      .slice(0, 6);
  }, [filteredCategories, recentCategories, type]);

  return (
    <form action={action} className="space-y-4">
      {infoMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-teal-200/60 bg-teal-50/60 px-4 py-3 text-sm text-teal-700 dark:border-teal-900/30 dark:bg-teal-950/20 dark:text-teal-300">
          <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          {infoMessage}
        </div>
      )}

      <div className="section-card overflow-hidden">
        {/* Type Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid var(--lk-border)" }}>
          {(["expense", "income", "transfer"] as const).map((t) => {
            const c = TYPE_CONFIG[t];
            const Icon = c.Icon;
            const isActive = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId(""); }}
                className={`relative flex flex-1 items-center justify-center gap-1.5 py-3.5 text-[11px] font-semibold transition-all sm:text-xs ${
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon size={12} className="shrink-0" />
                <span>{c.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ backgroundColor: c.accentHex }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="type" value={type} />

        {/* Hero Amount */}
        <div className="flex flex-col items-center justify-center px-6 py-8">
          <p
            className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: "var(--lk-text-muted)" }}
          >
            {type === "expense"
              ? "Jumlah Pengeluaran"
              : type === "income"
              ? "Jumlah Pemasukan"
              : "Jumlah Transfer"}
          </p>
          <div className="inline-flex items-baseline justify-center gap-1">
            <span className={`text-2xl font-black transition-colors duration-200 ${cfg.amountColor}`}>
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
              className={`min-w-[2ch] w-auto max-w-[220px] bg-transparent text-left text-5xl font-black outline-none border-none p-0 focus:ring-0 transition-colors duration-200 tabular-nums ${cfg.amountColor} ${cfg.placeholderColor}`}
              style={{ width: `${Math.max(2, amountDisplay.length || 1)}ch` }}
              required
            />
          </div>
          <div
            className="mt-5 h-px w-12 rounded-full opacity-25"
            style={{ backgroundColor: cfg.accentHex }}
          />
        </div>
        <input type="hidden" name="amount" value={amountDisplay.replace(/\D/g, "")} />

        {/* Field Rows */}
        <div
          className="divide-y"
          style={{ borderTop: "1px solid var(--lk-border)", borderColor: "var(--lk-border)" }}
        >
          {/* Tanggal */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--lk-bg)" }}
            >
              <CalendarDays size={14} style={{ color: "var(--lk-text-muted)" }} />
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: "var(--lk-text)" }}>
              Tanggal
            </span>
            <DateInput
              name="transaction_date"
              defaultValue={defaultDate}
              className="input-base w-auto text-right text-sm"
              required
            />
          </div>

          {/* Dompet */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--lk-bg)" }}
            >
              <Wallet size={14} style={{ color: "var(--lk-text-muted)" }} />
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: "var(--lk-text)" }}>
              {type === "transfer" ? "Dari Dompet" : "Dompet"}
            </span>
            <div className="w-[180px] shrink-0">
              <FormSelect
                name="wallet_id"
                value={walletId}
                onValueChange={setWalletId}
                options={wallets.map((w) => ({ value: w.id, label: w.name }))}
                required
              />
            </div>
          </div>

          {/* Dompet Tujuan */}
          {type === "transfer" && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--lk-bg)" }}
              >
                <ArrowLeftRight size={14} style={{ color: "var(--lk-text-muted)" }} />
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: "var(--lk-text)" }}>
                Ke Dompet
              </span>
              <div className="w-[180px] shrink-0">
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

          {/* Kategori */}
          {type !== "transfer" && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--lk-bg)" }}
                >
                  <Tag size={14} style={{ color: "var(--lk-text-muted)" }} />
                </div>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--lk-text)" }}>
                  Kategori
                </span>
                <div className="w-[180px] shrink-0">
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
              {recentCategoryChips.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-11">
                  {recentCategoryChips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${
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

          {/* Catatan */}
          <div className="px-4 py-3">
            {!showNote ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="flex items-center gap-2.5 text-xs font-medium transition-colors"
                style={{ color: "var(--lk-text-muted)" }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--lk-bg)" }}
                >
                  <Plus size={13} />
                </div>
                <span>Tambah Catatan</span>
              </button>
            ) : (
              <div className="flex gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--lk-bg)" }}
                >
                  <FileText size={14} style={{ color: "var(--lk-text-muted)" }} />
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--lk-text)" }}>
                      Catatan
                    </span>
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${
                        noteText.length >= NOTE_MAX_LENGTH * 0.9
                          ? "text-rose-500"
                          : "text-slate-400"
                      }`}
                    >
                      {noteText.length}/{NOTE_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="Contoh: makan siang, tiket bioskop..."
                    maxLength={NOTE_MAX_LENGTH}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="input-base textarea-base w-full resize-none text-sm"
                    autoFocus
                  />
                </div>
              </div>
            )}
            {!showNote && <input type="hidden" name="note" value="" />}
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 pt-2">
          <SubmitButton
            className={`w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${cfg.submitClass}`}
            pendingText="Menyimpan..."
          >
            Simpan Transaksi
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
} from "lucide-react";
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

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const recentCategoryChips = useMemo(() => {
    const allowedIds = new Set(filteredCategories.map((c) => c.id));
    return recentCategories
      .filter((c) => c.type === type && allowedIds.has(c.id))
      .slice(0, 5);
  }, [filteredCategories, recentCategories, type]);

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

  const chipSelected =
    type === "income"
      ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";

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
    <form action={action} className="section-card mt-4 space-y-4 p-4 sm:p-5">
      {/* Info message */}
      {infoMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
          {infoMessage}
        </div>
      )}

      {/* ── 1. Compact Segmented Control ── */}
      <div className="relative rounded-xl bg-slate-100/80 p-0.5 dark:bg-slate-800/70 ring-1 ring-black/5 dark:ring-white/5">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(33.333%-1px)] rounded-[10px] shadow-sm ${capsuleColor} transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
          style={{
            transform:
              type === "expense"
                ? "translateX(0)"
                : type === "income"
                  ? "translateX(calc(100% + 2px))"
                  : "translateX(calc(200% + 4px))",
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
                setType(id);
                setCategoryId("");
              }}
              className={`relative z-10 flex items-center justify-center gap-1 rounded-[10px] py-1.5 text-[10px] font-semibold transition-colors duration-200 sm:text-xs ${
                type === id
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={12} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name="type" value={type} />

      {/* ── 2. Borderless Hero Amount Input ── */}
      <div className="flex flex-col items-center justify-center py-1.5">
        <div className="flex w-full items-baseline justify-center gap-1.5 px-4">
          <span className={`text-lg font-extrabold ${accentText} transition-colors duration-300`}>
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
            className={`w-44 bg-transparent text-left text-3xl font-extrabold outline-none border-none p-0 focus:ring-0 ${accentText} ${accentPlaceholder} transition-colors duration-300`}
            required
          />
        </div>
        <input type="hidden" name="amount" value={amountDisplay.replace(/\D/g, "")} />
      </div>

      {/* ── 3. Horizontal Rows (label left, input right) ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
        
        {/* ROW: Tanggal */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            Tanggal
          </label>
          <div className="min-w-0 flex-1 max-w-[200px]">
            <DateInput
              name="transaction_date"
              defaultValue={defaultDate}
              className="input-base w-full text-right text-sm"
              required
            />
          </div>
        </div>

        {/* ROW: Dompet */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {type === "transfer" ? "Dari" : "Dompet"}
          </label>
          <div className="min-w-0 flex-1 max-w-[200px]">
            <FormSelect
              name="wallet_id"
              value={walletId}
              onValueChange={setWalletId}
              options={wallets.map((w) => ({ value: w.id, label: w.name }))}
              required
            />
          </div>
        </div>

        {/* ROW: Dompet Tujuan (Transfer only) */}
        {type === "transfer" && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              Tujuan
            </label>
            <div className="min-w-0 flex-1 max-w-[200px]">
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

        {/* ROW: Kategori */}
        {type !== "transfer" && (
          <div className="px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Kategori
              </label>
              <div className="min-w-0 flex-1 max-w-[200px]">
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
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {recentCategoryChips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all active:scale-95 ${
                      categoryId === c.id
                        ? chipSelected
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Collapsible Note ── */}
      {!showNote ? (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <Plus size={14} />
          Tambah Catatan
        </button>
      ) : (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Catatan
            </label>
            <span
              className={`text-[9px] font-semibold tabular-nums transition-colors ${
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
            className="input-base textarea-base resize-none text-sm"
            autoFocus
          />
        </div>
      )}
      {/* Always submit the note value even when hidden */}
      {!showNote && <input type="hidden" name="note" value="" />}

      {/* ── 5. Dynamic Submit Button ── */}
      <SubmitButton
        className={`w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${submitCls}`}
        pendingText="Menyimpan..."
      >
        Simpan Transaksi
      </SubmitButton>
    </form>
  );
}


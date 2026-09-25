"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import CurrencyAmount from "@/components/ui/currency-amount";
import FilterSelect from "./filter-select";
import { getCurrentMonth, pad2 } from "@/lib/utils/date";

type TxType = "income" | "expense" | "transfer" | "adjustment";
type TypeFilter = "all" | TxType;
type SortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type CategoryOption = {
  id: string;
  name: string;
  type: TxType;
};

type TransactionMobileFilterProps = {
  selectedMonth: string;
  totalIncome: number;
  totalExpense: number;
  categories: CategoryOption[];
  selectedType: TypeFilter;
  selectedCategoryId: string;
  selectedSort: SortMode;
  className?: string;
};

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const typeChips: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "adjustment", label: "Koreksi" },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "date_desc", label: "Terbaru" },
  { value: "date_asc", label: "Terlama" },
  { value: "amount_desc", label: "Tertinggi" },
  { value: "amount_asc", label: "Terendah" },
];

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/* ── Tombol ikon kecil (panah bulan / tahun) ── */
function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid shrink-0 place-items-center rounded-xl border disabled:opacity-50"
      style={{
        width: "2.5rem",
        height: "2.5rem",
        minWidth: "2.5rem",
        minHeight: "2.5rem",
        padding: 0,
        lineHeight: 0,
        borderColor: "var(--lk-border)",
        background: "var(--lk-surface-raised)",
        color: "var(--lk-text-muted)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

/* ── Bottom sheet pilih bulan & tahun ── */
function MonthPickerSheet({
  year,
  month,
  onSelect,
  onClose,
}: {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}) {
  const [pickerYear, setPickerYear] = useState(year);
  const [entered, setEntered] = useState(false);

  // Komponen ini hanya dirender setelah dibuka (client), jadi aman memanggil getCurrentMonth di sini
  const [todayYear, todayMonth] = useMemo(
    () => getCurrentMonth().split("-").map((n) => parseInt(n, 10)),
    [],
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Pilih bulan">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ opacity: entered ? 1 : 0, transition: "opacity 200ms ease" }}
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t px-4 pb-4"
        style={{
          background: "var(--lk-surface)",
          borderColor: "var(--lk-border)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div className="mx-auto mt-2.5 h-1 w-9 rounded-full" style={{ background: "var(--lk-border)" }} />

        <div className="flex items-center justify-between pb-3 pt-3">
          <p className="text-sm font-semibold" style={{ color: "var(--lk-text)" }}>
            Pilih bulan
          </p>
          <button
            type="button"
            onClick={() => onSelect(todayYear, todayMonth)}
            className="rounded-full px-3 text-xs font-semibold"
            style={{
              height: "2rem",
              minHeight: "2rem",
              color: "var(--lk-primary)",
              background: "var(--lk-primary-dim)",
            }}
          >
            Bulan ini
          </button>
        </div>

        {/* Tahun */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <IconButton label="Tahun sebelumnya" onClick={() => setPickerYear((y) => y - 1)}>
            <ChevronLeft size={18} />
          </IconButton>
          <p className="text-base font-bold tabular-nums" style={{ color: "var(--lk-text)" }}>
            {pickerYear}
          </p>
          <IconButton label="Tahun berikutnya" onClick={() => setPickerYear((y) => y + 1)}>
            <ChevronRight size={18} />
          </IconButton>
        </div>

        {/* Grid bulan */}
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((name, idx) => {
            const isSelected = pickerYear === year && idx + 1 === month;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(pickerYear, idx + 1)}
                className="rounded-xl border text-sm font-semibold"
                style={{
                  height: "2.75rem",
                  minHeight: "2.75rem",
                  borderColor: isSelected ? "var(--lk-text)" : "var(--lk-border)",
                  background: isSelected ? "var(--lk-text)" : "var(--lk-surface-raised)",
                  color: isSelected ? "var(--lk-bg)" : "var(--lk-text)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function TransactionMobileFilter({
  selectedMonth,
  totalIncome,
  totalExpense,
  categories,
  selectedType,
  selectedCategoryId,
  selectedSort,
  className = "",
}: TransactionMobileFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const activeChipRef = useRef<HTMLButtonElement | null>(null);

  const [yearStr, monthStr] = selectedMonth.split("-");
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10);

  const updateParams = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
    });
    params.delete("page");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const goToMonth = (year: number, month: number) => {
    updateParams({ month: `${year}-${pad2(month)}` });
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(currentYear, currentMonth - 1 + delta, 1));
    goToMonth(d.getUTCFullYear(), d.getUTCMonth() + 1);
  };

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const handleTypeChange = (next: TypeFilter) => {
    // Pertahankan kategori kalau masih cocok dengan tipe yang baru
    const keepCategory =
      next === "all" ||
      categories.some((c) => c.id === selectedCategoryId && c.type === next);
    updateParams({
      type: next === "all" ? "" : next,
      category: keepCategory ? selectedCategoryId : "",
    });
  };

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Semua kategori" },
      ...categories
        .filter((c) => selectedType === "all" || c.type === selectedType)
        .map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories, selectedType],
  );

  // Geser chip tipe yang aktif ke tengah supaya selalu kelihatan
  useEffect(() => {
    const container = chipsRef.current;
    const button = activeChipRef.current;
    if (!container || !button) return;
    container.scrollTo({
      left: Math.max(0, button.offsetLeft - (container.clientWidth - button.clientWidth) / 2),
      behavior: "smooth",
    });
  }, [selectedType]);

  return (
    <div className={`space-y-3 lg:hidden overflow-x-hidden ${className}`}>
      {/* Month navigator */}
      <div className={`flex items-center gap-2 ${isPending ? "opacity-70" : ""}`}>
        <IconButton label="Bulan sebelumnya" onClick={() => shiftMonth(-1)} disabled={isPending}>
          <ChevronLeft size={18} />
        </IconButton>

        <button
          type="button"
          aria-haspopup="dialog"
          aria-label="Pilih bulan dan tahun"
          onClick={() => setPickerOpen(true)}
          className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold"
          style={{
            height: "2.5rem",
            minHeight: "2.5rem",
            borderColor: "var(--lk-border)",
            background: "var(--lk-surface-raised)",
            color: "var(--lk-text)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span className="truncate">{formatMonthLabel(currentYear, currentMonth)}</span>
          <ChevronDown size={14} className="shrink-0" style={{ color: "var(--lk-text-faint)" }} />
        </button>

        <IconButton label="Bulan berikutnya" onClick={() => shiftMonth(1)} disabled={isPending}>
          <ChevronRight size={18} />
        </IconButton>
      </div>

      {/* Summary Card */}
      <div className={`relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/40 divide-x divide-slate-200/60 dark:divide-slate-700/60 p-0 overflow-hidden transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}>
        {/* Loading shimmer overlay */}
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/40 dark:bg-black/30 backdrop-blur-[1px]">
            <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        <div className="flex-1 text-center py-4 px-2 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate text-[0.65rem]">Pemasukan</p>
          <p className="mt-1 text-base font-bold text-[var(--lk-income)] tracking-tight truncate">
            +<CurrencyAmount amountIDR={totalIncome} absolute />
          </p>
        </div>
        <div className="flex-1 text-center py-4 px-2 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate text-[0.65rem]">Pengeluaran</p>
          <p className="mt-1 text-base font-bold text-[var(--lk-expense)] tracking-tight truncate">
            -<CurrencyAmount amountIDR={totalExpense} absolute />
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`space-y-2 transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Jenis transaksi: chip horizontal */}
        <div
          ref={chipsRef}
          role="group"
          aria-label="Jenis transaksi"
          className="no-scrollbar relative -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5"
        >
          {typeChips.map((chip) => {
            const isActive = chip.value === selectedType;
            return (
              <button
                key={chip.value}
                ref={isActive ? activeChipRef : null}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleTypeChange(chip.value)}
                className="inline-flex shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold"
                style={{
                  height: "2.25rem",
                  minHeight: "2.25rem",
                  borderColor: isActive ? "var(--lk-text)" : "var(--lk-border)",
                  background: isActive ? "var(--lk-text)" : "var(--lk-surface-raised)",
                  color: isActive ? "var(--lk-bg)" : "var(--lk-text-muted)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Kategori & urutan */}
        <div className="grid grid-cols-2 gap-2">
          <FilterSelect
            label="Kategori"
            value={selectedCategoryId}
            options={categoryOptions}
            searchable
            active={Boolean(selectedCategoryId)}
            onChange={(val) => updateParams({ category: val })}
            className="w-full"
          />
          <FilterSelect
            label="Urutkan"
            value={selectedSort}
            options={sortOptions}
            icon={<ArrowUpDown size={12} />}
            active={selectedSort !== "date_desc"}
            onChange={(val) => updateParams({ sort: val === "date_desc" ? "" : val })}
            className="w-full"
          />
        </div>
      </div>

      {pickerOpen && (
        <MonthPickerSheet
          year={currentYear}
          month={currentMonth}
          onClose={closePicker}
          onSelect={(y, m) => {
            setPickerOpen(false);
            goToMonth(y, m);
          }}
        />
      )}
    </div>
  );
}
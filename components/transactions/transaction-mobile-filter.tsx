"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import CurrencyAmount from "@/components/ui/currency-amount";
import FormSelect from "@/components/ui/form-select";
import { pad2 } from "@/lib/date";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer" | "adjustment";
};

type TransactionMobileFilterProps = {
  selectedMonth: string;
  totalIncome: number;
  totalExpense: number;
  categories: CategoryOption[];
  selectedType: "all" | "income" | "expense" | "transfer" | "adjustment";
  selectedCategoryId: string;
  selectedSort: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  className?: string;
};

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

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
  const yearScrollerRef = useRef<HTMLDivElement | null>(null);
  const monthScrollerRef = useRef<HTMLDivElement | null>(null);
  const activeYearButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeMonthButtonRef = useRef<HTMLButtonElement | null>(null);

  const [yearStr, monthStr] = selectedMonth.split("-");
  const currentYear = parseInt(yearStr);
  const currentMonth = parseInt(monthStr);

  const years = useMemo(() => {
    const yearsArray = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      yearsArray.push(i);
    }
    return yearsArray;
  }, [currentYear]);

  const handleYearChange = (year: number) => {
    const nextMonth = `${year}-${pad2(currentMonth)}`;
    updateParams({ month: nextMonth });
  };

  const handleMonthChange = (monthIdx: number) => {
    const nextMonth = `${currentYear}-${pad2(monthIdx + 1)}`;
    updateParams({ month: nextMonth });
  };

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

  const typeOptions = [
    { value: "all", label: "Tipe" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
    { value: "transfer", label: "Transfer" },
    { value: "adjustment", label: "Koreksi" },
  ];

  const categoryOptions = useMemo(() => [
    { value: "", label: "Kategori" },
    ...categories
      .filter(c => selectedType === "all" || c.type === selectedType)
      .map(c => ({ value: c.id, label: c.name }))
  ], [categories, selectedType]);

  const sortOptions = [
    { value: "", label: "Urut" },
    { value: "date_desc", label: "Terbaru" },
    { value: "date_asc", label: "Terlama" },
    { value: "amount_desc", label: "Tertinggi" },
    { value: "amount_asc", label: "Terendah" },
  ];

  useEffect(() => {
    const centerButton = (container: HTMLDivElement | null, button: HTMLButtonElement | null) => {
      if (!container || !button) return;

      const targetLeft =
        button.offsetLeft - (container.clientWidth / 2) + (button.clientWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    };

    centerButton(yearScrollerRef.current, activeYearButtonRef.current);
    centerButton(monthScrollerRef.current, activeMonthButtonRef.current);
  }, [currentMonth, currentYear]);

  return (
    <div className={`space-y-4 lg:hidden overflow-x-hidden ${className}`}>
      {/* Summary Card */}
      <div className="stat-card flex items-center p-0 overflow-hidden shadow-sm border-slate-200/60 divide-x divide-slate-200/80 dark:divide-slate-700/80">
        <div className="flex-1 text-center py-5 px-2 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate text-[0.65rem]">Income</p>
          <p className="mt-1 text-base font-bold text-emerald-600 tracking-tight truncate">
            +<CurrencyAmount amountIDR={totalIncome} absolute />
          </p>
        </div>
        <div className="flex-1 text-center py-5 px-2 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate text-[0.65rem]">Expense</p>
          <p className="mt-1 text-base font-bold text-rose-600 tracking-tight truncate">
            -<CurrencyAmount amountIDR={totalExpense} absolute />
          </p>
        </div>
      </div>

      {/* Year Selector */}
      <div
        ref={yearScrollerRef}
        className={`no-scrollbar -mx-4 flex snap-x snap-mandatory items-center gap-2.5 overflow-x-auto px-5 pb-1 [scroll-padding-inline:1.25rem] ${isPending ? "opacity-70" : ""}`}
      >
        {years.map((year) => (
          <button
            key={year}
            ref={year === currentYear ? activeYearButtonRef : null}
            onClick={() => handleYearChange(year)}
            disabled={isPending}
            className={`snap-center shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              year === currentYear
                ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.7)] dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-white/88 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {year}
          </button>
        ))}
        <div aria-hidden="true" className="w-1 shrink-0" />
      </div>

      {/* Month Selector */}
      <div
        ref={monthScrollerRef}
        className={`no-scrollbar -mx-4 flex snap-x snap-mandatory items-center gap-2.5 overflow-x-auto px-5 pb-1 [scroll-padding-inline:1.25rem] ${isPending ? "opacity-70" : ""}`}
      >
        {monthNames.map((name, idx) => {
          const isActive = idx + 1 === currentMonth;
          return (
            <button
              key={name}
              ref={isActive ? activeMonthButtonRef : null}
              onClick={() => handleMonthChange(idx)}
              disabled={isPending}
              className={`snap-center shrink-0 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.01em] transition-all duration-200 ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.7)] dark:border-white dark:bg-white dark:text-slate-900"
                  : "bg-white/88 border-slate-200 text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              {name}
            </button>
          );
        })}
        <div aria-hidden="true" className="w-1 shrink-0" />
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_minmax(0,0.95fr)] gap-2 pb-1">
        <div className="min-w-0">
          <FormSelect
            name="type"
            value={selectedType}
            options={typeOptions}
            disabled={isPending}
            onValueChange={(val) => updateParams({ type: val === "all" ? "" : val, category: "" })}
          />
        </div>
        <div className="min-w-0">
          <FormSelect
            name="category"
            value={selectedCategoryId}
            options={categoryOptions}
            disabled={isPending}
            onValueChange={(val) => updateParams({ category: val })}
          />
        </div>
        <div className="min-w-0">
          <FormSelect
            name="sort"
            value={selectedSort === "date_desc" ? "" : selectedSort}
            options={sortOptions}
            icon={<ArrowUpDown size={12} className="text-slate-400" />}
            disabled={isPending}
            onValueChange={(val) => updateParams({ sort: val })}
          />
        </div>
      </div>
    </div>
  );
}

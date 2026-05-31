"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import CurrencyAmount from "@/components/ui/currency-amount";
import FormSelect from "@/components/ui/form-select";
import { pad2 } from "@/lib/date";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type TransactionMobileFilterProps = {
  selectedMonth: string;
  totalIncome: number;
  totalExpense: number;
  categories: CategoryOption[];
  selectedType: "all" | "income" | "expense";
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
  ];

  const categoryOptions = useMemo(() => [
    { value: "", label: "Kategori" },
    ...categories
      .filter(c => selectedType === "all" || c.type === selectedType)
      .map(c => ({ value: c.id, label: c.name }))
  ], [categories, selectedType]);

  const sortOptions = [
    { value: "date_desc", label: "Terbaru" },
    { value: "date_asc", label: "Terlama" },
    { value: "amount_desc", label: "Tertinggi" },
    { value: "amount_asc", label: "Terendah" },
  ];

  return (
    <div className={`space-y-5 lg:hidden overflow-x-hidden ${className}`}>
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
      <div className={`no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 ${isPending ? "opacity-70" : ""}`}>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearChange(year)}
            disabled={isPending}
            className={`flex-shrink-0 rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${
              year === currentYear
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Month Selector */}
      <div className={`no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 ${isPending ? "opacity-70" : ""}`}>
        {monthNames.map((name, idx) => {
          const isActive = idx + 1 === currentMonth;
          return (
            <button
              key={name}
              onClick={() => handleMonthChange(idx)}
              disabled={isPending}
              className={`flex-shrink-0 rounded-full px-5 py-1.5 text-xs font-bold transition-all duration-300 border ${
                isActive
                  ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-3 gap-1.5 pb-2">
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
            value={selectedSort}
            options={sortOptions}
            icon={<ArrowUpDown size={12} className="text-slate-400" />}
            disabled={isPending}
            onValueChange={(val) => updateParams({ sort: val === "date_desc" ? "" : val })}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, RotateCcw, X } from "lucide-react";
import FormSelect from "@/components/ui/form-select";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type TransactionsFilterControlsProps = {
  categories: CategoryOption[];
  selectedType: "all" | "income" | "expense";
  selectedCategoryId: string;
  selectedSort: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  className?: string;
};

const sortLabelMap: Record<
  "date_desc" | "date_asc" | "amount_desc" | "amount_asc",
  string
> = {
  date_desc: "Terbaru",
  date_asc: "Terlama",
  amount_desc: "Tertinggi",
  amount_asc: "Terendah",
};

const typeLabelMap: Record<"income" | "expense", string> = {
  income: "Income",
  expense: "Expense",
};

export default function TransactionsFilterControls({
  categories,
  selectedType,
  selectedCategoryId,
  selectedSort,
  className = "",
}: TransactionsFilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const categoryOptions = useMemo(() => {
    if (selectedType === "all") return categories;
    return categories.filter((category) => category.type === selectedType);
  }, [categories, selectedType]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const hasActiveFilters =
    selectedType !== "all" || Boolean(selectedCategoryId) || selectedSort !== "date_desc";

  const typeSelectOptions = useMemo(
    () => [
      { value: "all", label: "Tipe" },
      { value: "income", label: "Income" },
      { value: "expense", label: "Expense" },
    ],
    [],
  );

  const categorySelectOptions = useMemo(
    () => [
      { value: "", label: "Kategori" },
      ...categoryOptions.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categoryOptions],
  );

  const sortSelectOptions = useMemo(
    () => [
      { value: "date_desc", label: "Urut" },
      { value: "date_asc", label: "Terlama" },
      { value: "amount_desc", label: "Tertinggi" },
      { value: "amount_asc", label: "Terendah" },
    ],
    [],
  );

  const applyPatch = useCallback(
    (patch: {
      type?: string;
      category?: string;
      sort?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextType = patch.type ?? params.get("type") ?? "all";
      const nextCategory = patch.category ?? params.get("category") ?? "";
      const nextSort = patch.sort ?? params.get("sort") ?? "date_desc";

      if (nextType && nextType !== "all") params.set("type", nextType);
      else params.delete("type");

      if (nextCategory) params.set("category", nextCategory);
      else params.delete("category");

      if (nextSort && nextSort !== "date_desc") params.set("sort", nextSort);
      else params.delete("sort");

      params.delete("page");

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        <div className="relative min-w-0">
          <FormSelect
            name="type_filter"
            value={selectedType}
            onValueChange={(nextType) => {
              const allowedCategories =
                nextType === "all"
                  ? categories
                  : categories.filter((item) => item.type === nextType);
              const keepCategory = allowedCategories.some((item) => item.id === selectedCategoryId);
              applyPatch({ type: nextType, category: keepCategory ? selectedCategoryId : "" });
            }}
            options={typeSelectOptions}
          />
        </div>

        <div className="relative min-w-0">
          <FormSelect
            name="category_filter"
            value={selectedCategoryId}
            onValueChange={(nextCategory) => applyPatch({ category: nextCategory })}
            options={categorySelectOptions}
          />
        </div>

        <div className="relative min-w-0">
          <FormSelect
            name="sort_filter"
            value={selectedSort}
            onValueChange={(nextSort) => applyPatch({ sort: nextSort })}
            options={sortSelectOptions}
          />
          {isPending ? (
            <LoaderCircle
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
            />
          ) : null}
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          {selectedType !== "all" ? (
            <button
              type="button"
              onClick={() => applyPatch({ type: "all", category: "" })}
              className="chip-neutral inline-flex items-center gap-1"
            >
              <span>{typeLabelMap[selectedType]}</span>
              <X size={12} />
            </button>
          ) : null}

          {selectedCategory ? (
            <button
              type="button"
              onClick={() => applyPatch({ category: "" })}
              className="chip-neutral inline-flex max-w-[140px] items-center gap-1"
              title={selectedCategory.name}
            >
              <span className="truncate">{selectedCategory.name}</span>
              <X size={12} className="shrink-0" />
            </button>
          ) : null}

          {selectedSort !== "date_desc" ? (
            <button
              type="button"
              onClick={() => applyPatch({ sort: "date_desc" })}
              className="chip-neutral inline-flex items-center gap-1"
            >
              <span>{sortLabelMap[selectedSort]}</span>
              <X size={12} />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => applyPatch({ type: "all", category: "", sort: "date_desc" })}
            className="btn-secondary h-8 gap-1 px-3 text-xs"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}

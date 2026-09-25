"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, LoaderCircle, RotateCcw } from "lucide-react";
import FilterSelect from "./filter-select";

type TxType = "income" | "expense" | "transfer" | "adjustment";
type TypeFilter = "all" | TxType;
type SortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type CategoryOption = {
  id: string;
  name: string;
  type: TxType;
};

type TransactionsFilterControlsProps = {
  categories: CategoryOption[];
  selectedType: TypeFilter;
  selectedCategoryId: string;
  selectedSort: SortMode;
  className?: string;
};

const typeSelectOptions: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Semua tipe" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "adjustment", label: "Koreksi" },
];

const sortSelectOptions: { value: SortMode; label: string }[] = [
  { value: "date_desc", label: "Terbaru" },
  { value: "date_asc", label: "Terlama" },
  { value: "amount_desc", label: "Tertinggi" },
  { value: "amount_asc", label: "Terendah" },
];

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

  const hasActiveFilters =
    selectedType !== "all" || Boolean(selectedCategoryId) || selectedSort !== "date_desc";

  const categorySelectOptions = useMemo(
    () => [
      { value: "", label: "Semua kategori" },
      ...categories
        .filter((category) => selectedType === "all" || category.type === selectedType)
        .map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories, selectedType],
  );

  const applyPatch = useCallback(
    (patch: { type?: string; category?: string; sort?: string }) => {
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
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`grid min-w-0 flex-1 grid-cols-3 gap-2 transition-opacity duration-150 ${
          isPending ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <FilterSelect
          label="Tipe"
          value={selectedType}
          options={typeSelectOptions}
          size="md"
          shape="soft"
          active={selectedType !== "all"}
          className="w-full"
          onChange={(nextType) => {
            // Pertahankan kategori kalau masih cocok dengan tipe yang baru
            const keepCategory =
              nextType === "all" ||
              categories.some((c) => c.id === selectedCategoryId && c.type === nextType);
            applyPatch({ type: nextType, category: keepCategory ? selectedCategoryId : "" });
          }}
        />

        <FilterSelect
          label="Kategori"
          value={selectedCategoryId}
          options={categorySelectOptions}
          searchable
          size="md"
          shape="soft"
          active={Boolean(selectedCategoryId)}
          className="w-full"
          onChange={(nextCategory) => applyPatch({ category: nextCategory })}
        />

        <FilterSelect
          label="Urutkan"
          value={selectedSort}
          options={sortSelectOptions}
          icon={<ArrowUpDown size={13} />}
          size="md"
          shape="soft"
          active={selectedSort !== "date_desc"}
          className="w-full"
          onChange={(nextSort) => applyPatch({ sort: nextSort })}
        />
      </div>

      {isPending ? (
        <LoaderCircle size={16} className="shrink-0 animate-spin text-slate-400" aria-hidden="true" />
      ) : null}

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => applyPatch({ type: "all", category: "", sort: "date_desc" })}
          className="btn-secondary h-10 shrink-0 gap-1.5 px-3 text-xs"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      ) : null}
    </div>
  );
}
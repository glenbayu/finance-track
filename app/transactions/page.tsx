import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import MonthFilter from "@/components/ui/month-filter";
import CurrencyAmount from "@/components/ui/currency-amount";
import EditTransactionButton from "@/components/transactions/edit-transaction-button";
import DeleteTransactionButton from "@/components/transactions/delete-transaction-button";
import DuplicateTransactionButton from "@/components/transactions/duplicate-transaction-button";
import TransactionsSearch from "@/components/transactions/transactions-search";
import TransactionsFilterControls from "@/components/transactions/transactions-filter-controls";
import { getCurrentMonth, getMonthRange, isMonthValue } from "@/lib/date";
import { requireUser } from "@/lib/supabase/auth";
import TransactionMobileFilter from "@/components/transactions/transaction-mobile-filter";

type TransactionsPageProps = {
  searchParams?: Promise<{
    month?: string;
    search?: string;
    page?: string;
    type?: string;
    category?: string;
    sort?: string;
  }>;
};

type TxType = "income" | "expense";
type SortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
type TypeFilter = "all" | TxType;

type CategoryRelation = { id?: string; name?: string; type?: TxType } | null;
type TransactionRow = {
  id: string;
  type: TxType;
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at: string | null;
  categories: CategoryRelation | CategoryRelation[];
};

type CategoryOption = {
  id: string;
  name: string;
  type: TxType;
  archived_at: string | null;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function parseSort(value: string | undefined): SortMode {
  if (value === "date_asc") return "date_asc";
  if (value === "amount_desc") return "amount_desc";
  if (value === "amount_asc") return "amount_asc";
  return "date_desc";
}

function parseTypeFilter(value: string | undefined): TypeFilter {
  if (value === "income") return "income";
  if (value === "expense") return "expense";
  return "all";
}

function toCategory(category: TransactionRow["categories"]) {
  if (Array.isArray(category)) return category[0] ?? null;
  return category;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!tokens.length) return text;

  const regex = new RegExp(`(${tokens.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={`${index}-${part}`}
        className="rounded bg-yellow-200/70 px-1 py-0.5 text-slate-900 dark:bg-yellow-500/25 dark:text-slate-100"
      >
        {part}
      </mark>
    ) : (
      <span key={`${index}-${part}`}>{part}</span>
    ),
  );
}

function matchesSearch(transaction: TransactionRow, keyword: string) {
  if (!keyword) return true;

  const normalized = keyword.toLowerCase();
  const categoryName = toCategory(transaction.categories)?.name ?? "";
  const note = transaction.note ?? "";
  const typeTokens = transaction.type === "income"
    ? ["income", "pemasukan", "masuk"]
    : ["expense", "pengeluaran", "keluar"];

  const amount = Number(transaction.amount);
  const amountRaw = String(Math.trunc(amount));
  const amountFormatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount).toLowerCase();
  const amountDigitsOnly = normalized.replace(/[^\d]/g, "");

  const textMatch =
    note.toLowerCase().includes(normalized) ||
    categoryName.toLowerCase().includes(normalized) ||
    typeTokens.some((token) => token.includes(normalized));

  const amountMatch =
    amountRaw.includes(normalized) ||
    amountFormatted.includes(normalized) ||
    (amountDigitsOnly ? amountRaw.includes(amountDigitsOnly) : false);

  return textMatch || amountMatch;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1).map(
      (page) => page as number | null,
    );
  }

  const includedPages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sortedPages = Array.from(includedPages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const paginationItems: Array<number | null> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      paginationItems.push(null);
    }
    paginationItems.push(page);
  });

  return paginationItems;
}

async function deleteTransaction(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/budgets");
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;

  const selectedMonth = isMonthValue(params?.month ?? "") ? (params?.month as string) : getCurrentMonth();
  const searchValue = String(params?.search ?? "");
  const searchQuery = searchValue.trim();
  const selectedType = parseTypeFilter(params?.type);
  const selectedCategoryId = String(params?.category ?? "").trim();
  const selectedSort = parseSort(params?.sort);

  const parsedPage = Number(params?.page);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0
    ? Math.floor(parsedPage)
    : 1;

  const ITEMS_PER_PAGE = 10;
  const { start, end } = getMonthRange(selectedMonth);

  const [transactionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(`
        id,
        type,
        amount,
        note,
        transaction_date,
        created_at,
        categories (
          id,
          name,
          type
        )
      `)
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lt("transaction_date", end),
    supabase
      .from("categories")
      .select("id, name, type, archived_at")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("name", { ascending: true }),
  ]);

  if (transactionsResult.error) {
    throw new Error(`Gagal memuat transaksi: ${transactionsResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(`Gagal memuat kategori: ${categoriesResult.error.message}`);
  }

  const allTransactions = (transactionsResult.data ?? []) as TransactionRow[];
  const categories = (categoriesResult.data ?? []) as CategoryOption[];
  const activeFilterCategories = categories
    .filter((category) => !category.archived_at)
    .map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }));

  const selectedCategoryFromData = (() => {
    if (!selectedCategoryId) return null;
    const fromActive = activeFilterCategories.find((category) => category.id === selectedCategoryId);
    if (fromActive) return fromActive;

    const fromTransactions = allTransactions.find((item) => toCategory(item.categories)?.id === selectedCategoryId);
    const relation = fromTransactions ? toCategory(fromTransactions.categories) : null;
    if (!relation?.id || !relation?.name || !relation?.type) return null;
    return {
      id: relation.id,
      name: `${relation.name} (arsip)`,
      type: relation.type,
    };
  })();

  const filterCategories = selectedCategoryFromData &&
    !activeFilterCategories.some((category) => category.id === selectedCategoryFromData.id)
    ? [...activeFilterCategories, selectedCategoryFromData]
    : activeFilterCategories;

  const filteredBySearch = allTransactions.filter((item) => matchesSearch(item, searchQuery));

  const filteredByType = filteredBySearch.filter((item) =>
    selectedType === "all" ? true : item.type === selectedType,
  );

  const filteredByCategory = filteredByType.filter((item) => {
    if (!selectedCategoryId) return true;
    const category = toCategory(item.categories);
    return category?.id === selectedCategoryId;
  });

  const sortedTransactions = [...filteredByCategory].sort((a, b) => {
    if (selectedSort === "date_asc") {
      const dateDiff = a.transaction_date.localeCompare(b.transaction_date);
      if (dateDiff !== 0) return dateDiff;
      return (a.created_at ?? "").localeCompare(b.created_at ?? "");
    }
    if (selectedSort === "amount_desc") {
      const amountDiff = Number(b.amount) - Number(a.amount);
      if (amountDiff !== 0) return amountDiff;
      return b.transaction_date.localeCompare(a.transaction_date);
    }
    if (selectedSort === "amount_asc") {
      const amountDiff = Number(a.amount) - Number(b.amount);
      if (amountDiff !== 0) return amountDiff;
      return b.transaction_date.localeCompare(a.transaction_date);
    }
    const dateDiff = b.transaction_date.localeCompare(a.transaction_date);
    if (dateDiff !== 0) return dateDiff;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  const totalCount = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;
  const paginatedTransactions = sortedTransactions.slice(from, to);

  if (currentPage > totalPages) {
    const next = new URLSearchParams();
    next.set("month", selectedMonth);
    if (searchQuery) next.set("search", searchQuery);
    if (selectedType !== "all") next.set("type", selectedType);
    if (selectedCategoryId) next.set("category", selectedCategoryId);
    if (selectedSort !== "date_desc") next.set("sort", selectedSort);
    if (totalPages > 1) next.set("page", String(totalPages));
    redirect(`/transactions?${next.toString()}`);
  }

  const buildPageHref = (page: number) => {
    const next = new URLSearchParams();
    next.set("month", selectedMonth);
    if (searchQuery) next.set("search", searchQuery);
    if (selectedType !== "all") next.set("type", selectedType);
    if (selectedCategoryId) next.set("category", selectedCategoryId);
    if (selectedSort !== "date_desc") next.set("sort", selectedSort);
    if (page > 1) next.set("page", String(page));
    return `/transactions?${next.toString()}`;
  };

  const paginationItems = getPaginationItems(currentPage, totalPages);
  const highlightQuery = searchQuery;

  // Use filteredByCategory so the summary card reflects the active filters
  const monthlyIncome = filteredByCategory
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyExpense = filteredByCategory
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <AppShell
      className="transactions-page journal-transactions"
      activeNav="transactions"
      month={selectedMonth}
      headerLayout="stacked"
      title="Daftar Transaksi"
      description="Semua pemasukan dan pengeluaran pada bulan terpilih."
      headerActionsClassName="lg:w-full lg:justify-start"
      headerActions={
        <div className="grid w-full gap-2 lg:grid-cols-[minmax(200px,240px)_minmax(260px,1fr)] xl:grid-cols-[minmax(210px,230px)_minmax(300px,1fr)]">
          <MonthFilter selectedMonth={selectedMonth} className="w-full" />
          <TransactionsSearch
            defaultValue={searchValue}
            className="w-full"
            placeholder="Cari catatan, kategori, tipe, atau nominal..."
          />
          <div className="lg:col-span-2">
            <TransactionsFilterControls
              categories={filterCategories}
              selectedType={selectedType}
              selectedCategoryId={selectedCategoryId}
              selectedSort={selectedSort}
            />
          </div>
        </div>
      }
      mobileActions={
        <>
          <TransactionsSearch
            defaultValue={searchValue}
            className="w-full"
            placeholder="Cari catatan, kategori, tipe, atau nominal..."
            smallScreenPlaceholder="Cari transaksi..."
            useSmallScreenPlaceholder
          />
          <TransactionMobileFilter
            selectedMonth={selectedMonth}
            totalIncome={monthlyIncome}
            totalExpense={monthlyExpense}
            categories={filterCategories}
            selectedType={selectedType}
            selectedCategoryId={selectedCategoryId}
            selectedSort={selectedSort}
          />
        </>
      }
    >
      <section className="table-shell">
        {paginatedTransactions.length === 0 ? (
          <div className="p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-600 dark:text-slate-300">
              <SearchX size={18} />
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {searchQuery || selectedType !== "all" || selectedCategoryId
                ? "Tidak ada transaksi yang cocok dengan filter kamu."
                : "Belum ada transaksi di bulan ini."}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/transactions/new" className="btn-primary">
                + Tambah Transaksi
              </Link>
              {searchQuery || selectedType !== "all" || selectedCategoryId || selectedSort !== "date_desc" ? (
                <Link href={`/transactions?month=${selectedMonth}`} className="btn-secondary">
                  Reset filter
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {paginatedTransactions.map((transaction) => {
                const category = toCategory(transaction.categories);

                return (
                  <article key={transaction.id} className="soft-inset">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {formatDate(transaction.transaction_date)}
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-900 dark:text-slate-100">
                          {category?.name
                            ? highlightText(category.name, highlightQuery)
                            : "Tanpa kategori"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 break-words dark:text-slate-300">
                          {transaction.note
                            ? highlightText(transaction.note, highlightQuery)
                            : "-"}
                        </p>
                      </div>

                      <span className={transaction.type === "income" ? "chip-income" : "chip-expense"}>
                        {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p
                        className={`text-lg font-semibold ${
                          transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        <CurrencyAmount amountIDR={Number(transaction.amount)} absolute />
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <DuplicateTransactionButton id={transaction.id} />
                        <EditTransactionButton id={transaction.id} />
                        <DeleteTransactionButton id={transaction.id} action={deleteTransaction} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/80 text-left dark:bg-slate-800/90">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Tanggal</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Tipe</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Kategori</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Catatan</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Jumlah</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => {
                    const category = toCategory(transaction.categories);
                    return (
                      <tr key={transaction.id} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={transaction.type === "income" ? "chip-income" : "chip-expense"}>
                            {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          {category?.name ? highlightText(category.name, highlightQuery) : "Tanpa kategori"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                          {transaction.note ? highlightText(transaction.note, highlightQuery) : "-"}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {transaction.type === "income" ? "+" : "-"}
                          <CurrencyAmount amountIDR={Number(transaction.amount)} absolute />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <DuplicateTransactionButton id={transaction.id} />
                            <EditTransactionButton id={transaction.id} />
                            <DeleteTransactionButton id={transaction.id} action={deleteTransaction} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Halaman {currentPage} dari {totalPages} - {totalCount} transaksi
              </p>

              <nav aria-label="Pagination transaksi" className="flex items-center gap-1.5">
                {currentPage > 1 ? (
                  <Link
                    href={buildPageHref(currentPage - 1)}
                    aria-label="Halaman sebelumnya"
                    className="btn-secondary h-9 w-9 px-0"
                  >
                    <ChevronLeft size={16} />
                  </Link>
                ) : (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
                  >
                    <ChevronLeft size={16} />
                  </span>
                )}

                {paginationItems.map((item, index) =>
                  item ? (
                    <Link
                      key={`page-${item}`}
                      href={buildPageHref(item)}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={
                        item === currentPage
                          ? "inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                          : "btn-secondary h-9 min-w-9 px-3"
                      }
                    >
                      {item}
                    </Link>
                  ) : (
                    <span
                      key={`ellipsis-${index}`}
                      className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-slate-500 dark:text-slate-400"
                    >
                      ...
                    </span>
                  ),
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={buildPageHref(currentPage + 1)}
                    aria-label="Halaman berikutnya"
                    className="btn-secondary h-9 w-9 px-0"
                  >
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
                  >
                    <ChevronRight size={16} />
                  </span>
                )}
              </nav>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}

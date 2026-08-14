import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, SearchX, ReceiptText } from "lucide-react";
import { Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import MonthFilter from "@/components/ui/month-filter";
import CurrencyAmount from "@/components/ui/currency-amount";
import EditTransactionButton from "@/components/transactions/edit-transaction-button";
import DeleteTransactionButton from "@/components/transactions/delete-transaction-button";
import DuplicateTransactionButton from "@/components/transactions/duplicate-transaction-button";
import TransactionsSearch from "@/components/transactions/transactions-search";
import TransactionsFilterControls from "@/components/transactions/transactions-filter-controls";
import { getCurrentMonth, getMonthRange, isMonthValue } from "@/lib/utils/date";
import { requireUser } from "@/lib/supabase/auth";
import TransactionMobileFilter from "@/components/transactions/transaction-mobile-filter";
import SwipeableRow from "@/components/ui/swipeable-row";
import SubmitButton from "@/components/ui/submit-button";
import { runMonthlyRollover } from "@/app/(app)/transactions/actions";

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

type TxType = "income" | "expense" | "transfer" | "adjustment";
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
  wallet_id: string | null;
  destination_wallet_id: string | null;
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

function getMobilePaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1).map(
      (page) => page as number | null,
    );
  }

  if (currentPage <= 3) {
    return [1, 2, 3, null, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, null, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, null, currentPage - 1, currentPage, currentPage + 1, null, totalPages];
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

  const currentMonth = getCurrentMonth();
  const selectedMonth = isMonthValue(params?.month ?? "") ? (params?.month as string) : currentMonth;
  const isViewingCurrentMonth = selectedMonth === currentMonth;

  let hasRolloverThisMonth = true;
  if (isViewingCurrentMonth) {
    // Cek rollover di tanggal 1 bulan ini
    const { data: rolloverMarkers } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("transaction_date", `${currentMonth}-01`)
      .in("note", ["Sisa uang bulan kemarin (Rollover)", "Defisit uang bulan kemarin (Rollover)"])
      .limit(1);

    if (rolloverMarkers && rolloverMarkers.length > 0) {
      hasRolloverThisMonth = true;
    } else {
      // Cek admin fee di akhir bulan lalu sebagai alternatif
      const { getPreviousMonth } = await import("@/lib/utils/date");
      const { pad2 } = await import("@/lib/utils/date");
      const prevMonth = getPreviousMonth(currentMonth);

      const [prevYear, prevMonthNum] = prevMonth.split("-").map(Number);
      const lastDayDate = new Date(Date.UTC(prevYear, prevMonthNum, 0));
      const lastDayOfPreviousMonth = `${prevYear}-${pad2(prevMonthNum)}-${pad2(lastDayDate.getUTCDate())}`;

      const { data: adminFeeMarkers } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("transaction_date", lastDayOfPreviousMonth)
        .eq("note", "Biaya Admin Rekening")
        .limit(1);

      hasRolloverThisMonth = !!(adminFeeMarkers && adminFeeMarkers.length > 0);
    }
  }
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

  const [transactionsResult, categoriesResult, walletsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(`
        id,
        type,
        amount,
        note,
        transaction_date,
        created_at,
        wallet_id,
        destination_wallet_id,
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
    supabase
      .from("wallets")
      .select("id, name")
      .eq("user_id", user.id)
  ]);

  if (transactionsResult.error) {
    throw new Error(`Gagal memuat transaksi: ${transactionsResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(`Gagal memuat kategori: ${categoriesResult.error.message}`);
  }

  const allTransactions = (transactionsResult.data ?? []) as TransactionRow[];
  const categories = (categoriesResult.data ?? []) as CategoryOption[];
  const walletsMap = new Map((walletsResult.data ?? []).map(w => [w.id, w.name]));
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
  const mobilePaginationItems = getMobilePaginationItems(currentPage, totalPages);
  const highlightQuery = searchQuery;

  // Use filteredByCategory so the summary card reflects the active filters
  const monthlyIncome = filteredByCategory
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyExpense = filteredByCategory
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Group transactions by date for mobile view
  const groupedTransactions = paginatedTransactions.reduce((groups, transaction) => {
    const date = transaction.transaction_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, TransactionRow[]>);
  
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <AppShell
      className="transactions-page journal-transactions"
      activeNav="transactions"
      month={selectedMonth}
      eyebrow="Aktivitas Keuangan"
      heroIcon={<ReceiptText size={19} strokeWidth={2.2} />}
      title="Daftar Transaksi"
      description="Semua pemasukan dan pengeluaran pada bulan terpilih."
      headerActionsClassName="hidden lg:flex lg:flex-1 lg:justify-end lg:pl-6"
      headerActions={
        <div className="flex w-full max-w-[540px] flex-col gap-2">
          {/* Baris Atas: Date & Search */}
          <div className="flex w-full gap-2">
            <Suspense fallback={<div className="h-10 w-[160px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
              <MonthFilter selectedMonth={selectedMonth} className="w-[160px] shrink-0" />
            </Suspense>
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
              <TransactionsSearch
                defaultValue={searchValue}
                className="flex-1"
                placeholder="Cari catatan, kategori..."
              />
            </Suspense>
          </div>
          {/* Baris Bawah: 3 Dropdown & Tambah */}
          <div className="flex w-full gap-2 items-center">
            <div className="flex-1 min-w-0">
              <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
                <TransactionsFilterControls
                  categories={filterCategories}
                  selectedType={selectedType}
                  selectedCategoryId={selectedCategoryId}
                  selectedSort={selectedSort}
                />
              </Suspense>
            </div>
            <Link
              href="/transactions/new"
              className="btn-primary shrink-0 flex items-center gap-2 rounded-lg px-5 py-[9px] text-sm font-semibold shadow-sm transition-all hover:scale-105"
            >
              <ReceiptText size={16} />
              Tambah Transaksi
            </Link>
          </div>
        </div>
      }
      mobileActions={
        <div className="flex flex-col gap-3">
          <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
            <TransactionsSearch
              defaultValue={searchValue}
              className="w-full"
              placeholder="Cari catatan, kategori, tipe, atau nominal..."
              smallScreenPlaceholder="Cari transaksi..."
              useSmallScreenPlaceholder
            />
          </Suspense>
          <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
            <TransactionMobileFilter
              selectedMonth={selectedMonth}
              totalIncome={monthlyIncome}
              totalExpense={monthlyExpense}
              categories={filterCategories}
              selectedType={selectedType}
              selectedCategoryId={selectedCategoryId}
              selectedSort={selectedSort}
            />
          </Suspense>
        </div>
      }
    >
      {!hasRolloverThisMonth && (
        <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: "var(--lk-primary-dim)", border: "1px solid var(--lk-primary)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--lk-primary-light)" }}>
                Rollover saldo belum diterapkan
              </h3>
              <p className="mt-1 text-xs" style={{ color: "var(--lk-text-muted)" }}>
                Terapkan rollover saldo sisa bulan lalu dan potong biaya admin Rp 6.000 otomatis untuk dompet bank kamu.
              </p>
            </div>
            <form action={runMonthlyRollover} className="shrink-0">
              <SubmitButton
                className="btn-primary h-9 rounded-md px-4 text-xs font-semibold border-none"
                pendingText="Memproses..."
              >
                Terapkan Rollover
              </SubmitButton>
            </form>
          </div>
        </div>
      )}

      <section className="table-shell">
        {paginatedTransactions.length === 0 ? (
          <div className="p-6 text-center sm:p-10">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)] text-slate-600 shadow-sm dark:text-slate-300">
              <SearchX size={22} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {searchQuery || selectedType !== "all" || selectedCategoryId
                ? "Transaksi tidak ditemukan"
                : "Belum ada transaksi bulan ini"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || selectedType !== "all" || selectedCategoryId
                ? "Coba ubah keyword, tipe transaksi, atau kategori agar data yang kamu cari muncul lagi."
                : "Mulai catat pemasukan atau pengeluaran supaya dashboard, laporan, dan forecast kamu makin akurat."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/transactions/new" className="btn-primary px-4 py-2 text-sm font-bold">
                + Tambah Transaksi
              </Link>
              {searchQuery || selectedType !== "all" || selectedCategoryId || selectedSort !== "date_desc" ? (
                <Link href={`/transactions?month=${selectedMonth}`} className="btn-secondary px-4 py-2 text-sm font-semibold">
                  Reset filter
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm flex flex-col divide-y divide-slate-100 dark:divide-slate-800/40">
              {sortedDates.map((date) => (
                <section key={date} className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/40">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 px-4 pt-3.5 pb-2 bg-slate-50/30 dark:bg-slate-900/10">
                    {formatDate(date)}
                  </h3>
                  {groupedTransactions[date].map((transaction) => {
                    const category = toCategory(transaction.categories);
                    const amountValue = Number(transaction.amount);
                    const useCompactAmount = Math.abs(amountValue) >= 100000;

                    return (
                      <SwipeableRow
                        key={transaction.id}
                        className="rounded-none"
                        actions={
                          <div className="flex h-full items-stretch">
                            <DuplicateTransactionButton id={transaction.id} className="flex items-center justify-center h-full w-16 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" label="" />
                            <EditTransactionButton id={transaction.id} className="flex items-center justify-center h-full w-16 bg-teal-500 text-white hover:bg-teal-600 transition-colors" label="" />
                            <DeleteTransactionButton id={transaction.id} action={deleteTransaction} className="flex items-center justify-center h-full w-16 bg-rose-500 text-white hover:bg-rose-600 transition-colors" label="" />
                          </div>
                        }
                        actionWidth={192}
                      >
                        <Link href={`/transactions/${transaction.id}/edit`} className="block group">
                          <article className="px-4 py-3.5 bg-white dark:bg-slate-900/40 active:bg-slate-50 dark:active:bg-slate-800/40 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                  {transaction.type === "transfer" 
                                    ? `${walletsMap.get(transaction.wallet_id || "") || "Dompet"} ➔ ${walletsMap.get(transaction.destination_wallet_id || "") || "Tujuan"}`
                                    : transaction.type === "adjustment"
                                    ? `${walletsMap.get(transaction.wallet_id || "") || "Dompet"} (Koreksi)`
                                    : category?.name
                                    ? highlightText(category.name, highlightQuery)
                                    : "Tanpa kategori"}
                                </p>
                                <p className="mt-0.5 text-xs break-words line-clamp-1 text-slate-500 dark:text-slate-400">
                                  {transaction.note
                                    ? highlightText(transaction.note, highlightQuery)
                                    : <span className="italic opacity-50">Tanpa catatan</span>}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <p className={`whitespace-nowrap text-sm font-semibold ${
                                  transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" :
                                  transaction.type === "expense" ? "text-rose-600 dark:text-rose-400" :
                                  transaction.type === "transfer" ? "text-blue-600 dark:text-blue-400" :
                                  "text-slate-900 dark:text-slate-100"
                                }`}>
                                  {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                                  <CurrencyAmount amountIDR={amountValue} absolute compact={useCompactAmount} />
                                </p>
                                <span className={
                                  transaction.type === "income" ? "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : 
                                  transaction.type === "expense" ? "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : 
                                  transaction.type === "transfer" ? "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" :
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                                }>
                                  {transaction.type === "income" ? "Pemasukan" :
                                    transaction.type === "expense" ? "Pengeluaran" :
                                      transaction.type === "transfer" ? "Transfer" : "Penyesuaian"}
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      </SwipeableRow>
                    );
                  })}
                </section>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full caption-bottom text-sm border-collapse">
                <thead className="[&_tr]:border-b border-slate-200 dark:border-slate-800/60">
                  <tr className="border-b transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Tanggal</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Tipe</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Kategori</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Catatan</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">Jumlah</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-slate-500 dark:text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {paginatedTransactions.map((transaction) => {
                    const category = toCategory(transaction.categories);
                    return (
                      <tr key={transaction.id} className="border-b border-slate-200 dark:border-slate-800/60 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-4 align-middle font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="p-4 align-middle">
                          <span className={
                            transaction.type === "income" ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : 
                            transaction.type === "expense" ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : 
                            transaction.type === "transfer" ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" :
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                          }>
                            {transaction.type === "income" ? "Pemasukan" : 
                             transaction.type === "expense" ? "Pengeluaran" : 
                             transaction.type === "transfer" ? "Transfer" : "Penyesuaian"}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-slate-600 dark:text-slate-300">
                          {transaction.type === "transfer" 
                            ? `${walletsMap.get(transaction.wallet_id || "") || "Dompet"} ➔ ${walletsMap.get(transaction.destination_wallet_id || "") || "Tujuan"}`
                            : transaction.type === "adjustment"
                            ? `${walletsMap.get(transaction.wallet_id || "") || "Dompet"} (Koreksi)`
                            : category?.name
                            ? highlightText(category.name, highlightQuery)
                            : "Tanpa kategori"}
                        </td>
                        <td className="p-4 align-middle text-slate-500 dark:text-slate-400 text-sm">
                          {transaction.note ? highlightText(transaction.note, highlightQuery) : "-"}
                        </td>
                        <td className={`p-4 align-middle text-right font-semibold ${
                          transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" :
                          transaction.type === "expense" ? "text-rose-600 dark:text-rose-400" :
                          transaction.type === "transfer" ? "text-blue-600 dark:text-blue-400" :
                          "text-slate-900 dark:text-slate-100"
                        }`}>
                          {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                          <CurrencyAmount amountIDR={Number(transaction.amount)} absolute />
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity [&:focus-within]:opacity-100 sm:opacity-100">
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

            <div className="p-4 md:border-t md:border-[color:var(--lk-border)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs md:text-sm" style={{ color: "var(--lk-text-muted)" }}>
                  <span className="md:hidden">
                    Hal. {currentPage}/{totalPages} &bull; {totalCount} transaksi
                  </span>
                  <span className="hidden md:inline">
                    Halaman {currentPage} dari {totalPages} - {totalCount} transaksi
                  </span>
                </p>

                <nav
                  aria-label="Pagination transaksi"
                  className="w-full md:hidden"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    {currentPage > 1 ? (
                      <Link
                        href={buildPageHref(currentPage - 1)}
                        aria-label="Halaman sebelumnya"
                        className="btn-secondary h-8 w-8 shrink-0 px-0"
                      >
                        <ChevronLeft size={14} />
                      </Link>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)] text-slate-300 dark:text-slate-600"
                      >
                        <ChevronLeft size={14} />
                      </span>
                    )}

                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                      {mobilePaginationItems.map((item, index) =>
                        item ? (
                          <Link
                            key={`mobile-page-${item}`}
                            href={buildPageHref(item)}
                            aria-current={item === currentPage ? "page" : undefined}
                            className={
                              item === currentPage
                                ? "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 px-2.5 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                                : "btn-secondary h-8 min-w-8 shrink-0 px-2.5 text-xs"
                            }
                          >
                            {item}
                          </Link>
                        ) : (
                          <span
                            key={`mobile-ellipsis-${index}`}
                            className="inline-flex h-8 min-w-4 shrink-0 items-center justify-center px-0.5 text-xs text-slate-500 dark:text-slate-400"
                          >
                            ...
                          </span>
                        ),
                      )}
                    </div>

                    {currentPage < totalPages ? (
                      <Link
                        href={buildPageHref(currentPage + 1)}
                        aria-label="Halaman berikutnya"
                        className="btn-secondary h-8 w-8 shrink-0 px-0"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)] text-slate-300 dark:text-slate-600"
                      >
                        <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </nav>

                <nav
                  aria-label="Pagination transaksi"
                  className="hidden md:block md:w-auto"
                >
                  <div className="flex items-center gap-1.5 md:min-w-0 md:flex-nowrap md:justify-end">
                    {currentPage > 1 ? (
                      <Link
                        href={buildPageHref(currentPage - 1)}
                        aria-label="Halaman sebelumnya"
                        className="btn-secondary h-9 w-9 shrink-0 px-0"
                      >
                        <ChevronLeft size={16} />
                      </Link>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)] text-slate-300 dark:text-slate-600"
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
                              ? "inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                              : "btn-secondary h-9 min-w-9 shrink-0 px-3"
                          }
                        >
                          {item}
                        </Link>
                      ) : (
                        <span
                          key={`ellipsis-${index}`}
                          className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center px-1 text-sm text-slate-500 dark:text-slate-400"
                        >
                          ...
                        </span>
                      ),
                    )}

                    {currentPage < totalPages ? (
                      <Link
                        href={buildPageHref(currentPage + 1)}
                        aria-label="Halaman berikutnya"
                        className="btn-secondary h-9 w-9 shrink-0 px-0"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)] text-slate-300 dark:text-slate-600"
                      >
                        <ChevronRight size={16} />
                      </span>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}

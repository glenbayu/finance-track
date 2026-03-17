import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import DeleteTransactionButton from "@/components/delete-transaction-button";
import EditTransactionButton from "@/components/edit-transaction-button";
import LogoutButton from "@/components/logout-button";
import MonthFilter from "@/components/month-filter";
import TransactionsSearch from "@/components/transactions-search";
import { requireUser } from "@/lib/supabase/auth";
import { CalendarDays, House } from "lucide-react";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getMonthRange(month: string) {
  const [year, monthNum] = month.split("-").map(Number);

  const startYear = year;
  const startMonth = monthNum;
  const endYear = monthNum === 12 ? year + 1 : year;
  const endMonth = monthNum === 12 ? 1 : monthNum + 1;

  return {
    start: `${startYear}-${pad2(startMonth)}-01`,
    end: `${endYear}-${pad2(endMonth)}-01`,
  };
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

async function deleteTransaction(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/transactions");
}

type TransactionsPageProps = {
  searchParams?: Promise<{
    month?: string;
    search?: string;
    page?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const selectedMonth =
    params?.month ?? getCurrentMonth();

  const { start, end } = getMonthRange(selectedMonth);
  const searchValue = params?.search ?? "";
  const searchQuery = searchValue.trim();

  const ITEMS_PER_PAGE = 10;
  const parsedPage = Number(params?.page);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0
    ? Math.floor(parsedPage)
    : 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const keyword = searchQuery.replaceAll(",", " ").trim();
  const loweredKeyword = keyword.toLowerCase();
  const inferredType =
    loweredKeyword === "income" ||
    loweredKeyword === "pemasukan" ||
    loweredKeyword === "masuk"
      ? "income"
      : loweredKeyword === "expense" ||
          loweredKeyword === "pengeluaran" ||
          loweredKeyword === "keluar"
        ? "expense"
        : null;

  let queryBuilder = supabase
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
  `, { count: "exact" })
    .eq("user_id", user.id)
    .gte("transaction_date", start)
    .lt("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (inferredType) {
    queryBuilder = queryBuilder.eq("type", inferredType);
  } else if (keyword) {
    queryBuilder = queryBuilder.or(
      `note.ilike.%${keyword}%,type.ilike.%${keyword}%,categories.name.ilike.%${keyword}%`,
    );
  }

  const { data: transactions, error, count } = await queryBuilder.range(from, to);
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const highlightQuery = inferredType ? "" : keyword;

  if (currentPage > totalPages) {
    const searchParams = new URLSearchParams();
    searchParams.set("month", selectedMonth);
    if (searchQuery) searchParams.set("search", searchQuery);
    searchParams.set("page", String(totalPages));
    redirect(`/transactions?${searchParams.toString()}`);
  }

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    params.set("month", selectedMonth);
    if (searchQuery) params.set("search", searchQuery);
    params.set("page", String(page));
    return `/transactions?${params.toString()}`;
  };

  return (
    <main className="page-shell transactions-page">
      <div className="page-container max-w-6xl">
        <section className="hero-panel lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">Daftar Transaksi</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Semua pemasukan dan pengeluaran pada bulan terpilih.
              </p>
            </div>

            <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:gap-2">
              <MonthFilter selectedMonth={selectedMonth} />

              <div className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />

              <Link
                href={`/?month=${selectedMonth}`}
                aria-label="Dashboard"
                title="Dashboard"
                className="btn-secondary h-10 w-10 px-0"
              >
                <House size={16} />
                <span className="sr-only">Dashboard</span>
              </Link>
              <Link href="/transactions/new" className="btn-primary h-10 px-5">
                + Transaksi
              </Link>
              <Link href="/categories" className="btn-secondary h-10 px-4">
                Kategori
              </Link>
              <LogoutButton className="btn-secondary h-10 gap-2 px-3.5 text-slate-500 dark:text-slate-300" />
            </div>
          </div>

          <TransactionsSearch
            defaultValue={searchValue}
            className="mt-4 hidden lg:block sm:w-72"
          />

          <div className="mt-5 grid gap-3 lg:hidden">
            <form className="flex w-full min-w-0 items-center gap-2">
              <div className="relative min-w-0">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                />
                <input
                  type="month"
                  name="month"
                  defaultValue={selectedMonth}
                  className="input-base h-10 w-full max-w-[190px] min-w-0 py-2 pl-9"
                />
              </div>
              <input type="hidden" name="search" value={searchValue} />
              <input type="hidden" name="page" value="1" />
              <button
                type="submit"
                className="btn-secondary h-10 w-[110px] shrink-0"
              >
                Terapkan
              </button>
            </form>

            <div className="flex w-full items-center gap-2">
              <Link
                href={`/?month=${selectedMonth}`}
                aria-label="Dashboard"
                title="Dashboard"
                className="btn-secondary h-10 w-[50px] shrink-0"
              >
                <House size={16} />
                <span className="sr-only">Dashboard</span>
              </Link>
              <Link
                href="/transactions/new"
                className="btn-primary h-10 flex-1"
              >
                + Transaksi
              </Link>
            </div>

            <TransactionsSearch defaultValue={searchValue} />
          </div>
        </section>

        <section className="table-shell mt-6">
          {error ? (
            <div className="p-6 text-rose-600">Error: {error.message}</div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300">
                {searchQuery
                  ? "Tidak ada transaksi yang cocok dengan pencarian kamu."
                  : "Belum ada transaksi di bulan ini."}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href="/transactions/new" className="btn-primary">
                  + Tambah Transaksi
                </Link>
                {searchQuery ? (
                  <Link href={`/transactions?month=${selectedMonth}`} className="btn-secondary">
                    Reset filter
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {transactions.map((transaction) => {
                  const category = Array.isArray(transaction.categories)
                    ? transaction.categories[0]
                    : transaction.categories;

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
                              : "-"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500 break-words dark:text-slate-300">
                            {transaction.note
                              ? highlightText(transaction.note, highlightQuery)
                              : "-"}
                          </p>
                        </div>

                        <span
                          className={transaction.type === "income" ? "chip-income" : "chip-expense"}
                        >
                          {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p
                          className={`text-lg font-semibold ${transaction.type === "income"
                            ? "text-emerald-600"
                            : "text-rose-600"
                            }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatRupiah(Number(transaction.amount))}
                        </p>

                        <div className="flex items-center gap-2">
                          <EditTransactionButton id={transaction.id} />
                          <DeleteTransactionButton
                            id={transaction.id}
                            action={deleteTransaction}
                          />
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
                    {transactions.map((transaction) => {
                      const category = Array.isArray(transaction.categories)
                        ? transaction.categories[0]
                        : transaction.categories;

                      return (
                        <tr key={transaction.id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={transaction.type === "income" ? "chip-income" : "chip-expense"}
                            >
                              {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {category?.name
                              ? highlightText(category.name, highlightQuery)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                            {transaction.note
                              ? highlightText(transaction.note, highlightQuery)
                              : "-"}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${transaction.type === "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                              }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatRupiah(Number(transaction.amount))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <EditTransactionButton id={transaction.id} />
                              <DeleteTransactionButton
                                id={transaction.id}
                                action={deleteTransaction}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Halaman {currentPage} dari {totalPages} • {totalCount} transaksi
                </p>
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link href={buildPageHref(currentPage - 1)} className="btn-secondary h-10 px-4">
                      Sebelumnya
                    </Link>
                  ) : (
                    <span className="btn-secondary h-10 px-4 pointer-events-none opacity-50">
                      Sebelumnya
                    </span>
                  )}
                  {currentPage < totalPages ? (
                    <Link href={buildPageHref(currentPage + 1)} className="btn-secondary h-10 px-4">
                      Berikutnya
                    </Link>
                  ) : (
                    <span className="btn-secondary h-10 px-4 pointer-events-none opacity-50">
                      Berikutnya
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

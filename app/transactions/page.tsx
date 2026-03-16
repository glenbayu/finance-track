import Link from "next/link";
import { revalidatePath } from "next/cache";
import DeleteTransactionButton from "@/components/delete-transaction-button";
import EditTransactionButton from "@/components/edit-transaction-button";
import LogoutButton from "@/components/logout-button";
import MonthFilter from "@/components/month-filter";
import { requireUser } from "@/lib/supabase/auth";
import { CalendarDays, LayoutDashboard } from "lucide-react";

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
  const searchQuery = params?.search?.toLowerCase() ?? "";

  const { data: transactions, error } = await supabase
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
    .lt("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  const filteredTransactions =
    transactions?.filter((transaction) => {
      if (!searchQuery) return true;

      const category = Array.isArray(transaction.categories)
        ? transaction.categories[0]
        : transaction.categories;

      const note = transaction.note?.toLowerCase() ?? "";
      const type = transaction.type?.toLowerCase() ?? "";
      const categoryName = category?.name?.toLowerCase() ?? "";
      const keyword = searchQuery.toLowerCase();

      return (
        note.includes(keyword) ||
        type.includes(keyword) ||
        categoryName.includes(keyword)
      );
    }) ?? [];

  return (
    <main className="page-shell">
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
                <LayoutDashboard size={16} />
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

          <form className="mt-4 hidden lg:block">
            <input type="hidden" name="month" value={selectedMonth} />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Cari catatan, kategori, atau tipe..."
              className="input-base h-10 w-full sm:w-72"
            />
          </form>

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
              <input type="hidden" name="search" value={searchQuery} />
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
                <LayoutDashboard size={16} />
                <span className="sr-only">Dashboard</span>
              </Link>
              <Link
                href="/transactions/new"
                className="btn-primary h-10 flex-1"
              >
                + Transaksi
              </Link>
            </div>

            <form>
              <input type="hidden" name="month" value={selectedMonth} />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Cari catatan, kategori, atau tipe..."
                className="input-base h-10 w-full"
              />
            </form>
          </div>
        </section>

        <section className="table-shell mt-6">
          {error ? (
            <div className="p-6 text-rose-600">Error: {error.message}</div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="p-6 text-slate-600 dark:text-slate-300">
              Belum ada transaksi di bulan ini.
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {filteredTransactions.map((transaction) => {
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
                            {category?.name ?? "-"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500 break-words dark:text-slate-300">
                            {transaction.note || "-"}
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
                    {filteredTransactions.map((transaction) => {
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
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{category?.name ?? "-"}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                            {transaction.note || "-"}
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
            </>
          )}
        </section>
      </div>
    </main>
  );
}

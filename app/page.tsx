import Link from "next/link";
import { revalidatePath } from "next/cache";
import MonthlyExpenseTrend from "@/components/monthly-expense-trend";
import QuickAddTransaction from "@/components/quick-add-transaction";
import TopSpendingInsight from "@/components/top-spending-insight";
import ExpenseChart from "@/components/expense-chart";
import MonthlyHistory from "@/components/monthly-history";
import LogoutButton from "@/components/logout-button";
import MaskedAmount, { MaskedAmountProvider } from "@/components/masked-amount";
import MonthFilter from "@/components/month-filter";
import { requireUser } from "@/lib/supabase/auth";
import { ArrowUpRight, ReceiptText, Wallet } from "lucide-react";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
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

function getPreviousMonth(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  if (!year || !monthNum) return getCurrentMonth();

  const prevYear = monthNum === 1 ? year - 1 : year;
  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  return `${prevYear}-${pad2(prevMonth)}`;
}

type HomeProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

async function quickAddTransaction(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const type = formData.get("type") as "income" | "expense";
  const amount = Number(formData.get("amount"));
  const categoryId = formData.get("category_id") as string;

  if (!type || !categoryId) {
    throw new Error("Data quick add belum lengkap.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Jumlah transaksi harus lebih dari 0.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .single();

  if (categoryError || !category) {
    throw new Error("Kategori tidak valid.");
  }

  const today = formatDateOnly(new Date());

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    category_id: categoryId,
    note: "Quick Add",
    transaction_date: today,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/transactions");
}

export default async function Home({ searchParams }: HomeProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const selectedMonth =
    params?.month ?? getCurrentMonth();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name", { ascending: true });

  const { start, end } = getMonthRange(selectedMonth);
  const previousMonth = getPreviousMonth(selectedMonth);
  const { start: previousStart, end: previousEnd } = getMonthRange(previousMonth);

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
        name
      )
    `)
    .eq("user_id", user.id)
    .gte("transaction_date", start)
    .lt("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: allTransactions } = await supabase
    .from("transactions")
    .select(`
      id,
      type,
      amount,
      note,
      transaction_date,
      categories (
        name
      )
    `)
    .eq("user_id", user.id)
    .gte("transaction_date", start)
    .lt("transaction_date", end);

  const { data: previousExpenses } = await supabase
    .from("transactions")
    .select(`
      amount,
      categories (
        name
      )
    `)
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("transaction_date", previousStart)
    .lt("transaction_date", previousEnd);

  const { data: historyTransactions } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  const totalIncome =
    allTransactions
      ?.filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;

  const totalExpense =
    allTransactions
      ?.filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;

  const balance = totalIncome - totalExpense;

  const expenseMap = new Map<
    string,
    {
      amount: number;
      count: number;
      transactions: {
        id: string;
        amount: number;
        note: string | null;
        transaction_date: string | null;
      }[];
    }
  >();

  allTransactions
    ?.filter((item) => item.type === "expense")
    .forEach((item) => {
      const category = Array.isArray(item.categories)
        ? item.categories[0]
        : item.categories;

      const categoryName = category?.name ?? "Tanpa kategori";
      const current = expenseMap.get(categoryName) ?? {
        amount: 0,
        count: 0,
        transactions: [],
      };

      current.amount += Number(item.amount);
      current.count += 1;
      current.transactions.push({
        id: item.id,
        amount: Number(item.amount),
        note: item.note,
        transaction_date: item.transaction_date,
      });
      expenseMap.set(categoryName, current);
    });

  const expenseChartData = Array.from(expenseMap.entries())
    .map(([name, value]) => ({
      name,
      value: value.amount,
    }))
    .sort((a, b) => b.value - a.value);

  const previousExpenseMap = new Map<string, number>();
  previousExpenses?.forEach((item) => {
    const category = Array.isArray(item.categories)
      ? item.categories[0]
      : item.categories;
    const categoryName = category?.name ?? "Tanpa kategori";
    previousExpenseMap.set(
      categoryName,
      (previousExpenseMap.get(categoryName) ?? 0) + Number(item.amount),
    );
  });

  const monthlyMap = new Map<
    string,
    { month: string; income: number; expense: number; balance: number }
  >();

  historyTransactions?.forEach((item) => {
    if (!item.transaction_date) return;

    const monthKey = item.transaction_date.slice(0, 7);

    const current = monthlyMap.get(monthKey) ?? {
      month: monthKey,
      income: 0,
      expense: 0,
      balance: 0,
    };

    if (item.type === "income") {
      current.income += Number(item.amount);
    } else {
      current.expense += Number(item.amount);
    }

    current.balance = current.income - current.expense;

    monthlyMap.set(monthKey, current);
  });

  const monthlyHistoryData = Array.from(monthlyMap.values())
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);

  const monthlyExpenseTrendData = Array.from(monthlyMap.values())
    .map((item) => ({
      month: item.month,
      expense: item.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const topSpendingData =
    Array.from(expenseMap.entries())
      .map(([category_name, value]) => ({
        previous_amount: previousExpenseMap.get(category_name) ?? 0,
        change_pct:
          (previousExpenseMap.get(category_name) ?? 0) > 0
            ? ((value.amount - (previousExpenseMap.get(category_name) ?? 0)) /
                (previousExpenseMap.get(category_name) ?? 0)) *
              100
            : null,
        category_name,
        amount: value.amount,
        transaction_count: value.count,
        transactions: [...value.transactions].sort((a, b) => {
          const amountDiff = b.amount - a.amount;
          if (amountDiff !== 0) return amountDiff;
          return (b.transaction_date ?? "").localeCompare(a.transaction_date ?? "");
        }),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3) ?? [];

  return (
    <main className="page-shell">
      <div className="page-container">
        <section className="hero-panel lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                Personal Finance
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">Finance Tracker</h1>
              <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                Dashboard untuk memantau arus kas dan pola pengeluaran bulanan.
              </p>
            </div>

            <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:gap-2">
              <MonthFilter selectedMonth={selectedMonth} />

              <div className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />

              <Link
                href={`/transactions?month=${selectedMonth}`}
                className="btn-secondary h-10 gap-2"
              >
                <ReceiptText size={16} />
                Transaksi
              </Link>

              <Link href="/transactions/new" className="btn-primary h-10 px-5">
                + Transaksi
              </Link>

              <Link href="/categories" className="btn-secondary h-10 px-4">
                Kategori
              </Link>

              <LogoutButton
                iconOnly
                className="btn-secondary h-10 w-10 px-0 text-slate-500 dark:text-slate-300"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:hidden">
            <div className="flex w-full min-w-0 items-center gap-2">
              <MonthFilter selectedMonth={selectedMonth} className="flex-1" />
              <LogoutButton
                iconOnly
                className="btn-secondary h-10 w-10 shrink-0 justify-center px-0"
              />
            </div>

            <div className="flex w-full items-center gap-2">
              <Link
                href={`/transactions?month=${selectedMonth}`}
                aria-label="Lihat transaksi"
                title="Lihat transaksi"
                className="btn-secondary h-10 w-[50px] shrink-0"
              >
                <ReceiptText size={16} />
                <span className="sr-only">Lihat Transaksi</span>
              </Link>
              <Link
                href="/transactions/new"
                className="btn-primary h-10 flex-1"
              >
                + Transaksi
              </Link>
            </div>
            <div className="mt-6">
              <QuickAddTransaction
                categories={categories ?? []}
                action={quickAddTransaction}
              />
            </div>
          </div>
        </section>

        <MaskedAmountProvider storageKey="ft_hide_amounts">
          <section className="mt-8 grid gap-4 md:mt-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start [&>*]:min-w-0 [&>*]:w-full">
            <article className="stat-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Bulan Ini</p>
                <span className="rounded-full bg-slate-200 p-2 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  <Wallet size={14} />
                </span>
              </div>
              <MaskedAmount
                value={formatRupiah(balance)}
                valueClassName="text-2xl font-bold text-slate-900 dark:text-slate-100"
                maskedText="***"
                showLabel="Tampilkan saldo"
                hideLabel="Sembunyikan saldo"
              />
            </article>

            <article className="stat-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Pemasukan</p>
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <ArrowUpRight size={14} />
                </span>
              </div>
              <MaskedAmount
                value={formatRupiah(totalIncome)}
                valueClassName="text-2xl font-bold text-emerald-600"
                maskedText="***"
                showToggle={false}
              />
            </article>

            <div className="hidden lg:block">
              <QuickAddTransaction
                categories={categories ?? []}
                action={quickAddTransaction}
              />
            </div>
          </section>

          <section className="mt-8 grid gap-5 md:mt-6 lg:grid-cols-12 lg:items-start [&>*]:min-w-0 [&>*]:w-full">
            <div className="min-w-0 w-full lg:col-span-7">
              <ExpenseChart data={expenseChartData} />
            </div>

            <div className="min-w-0 w-full lg:col-span-5">
              <TopSpendingInsight data={topSpendingData} />
            </div>

            <div className="min-w-0 w-full space-y-5 lg:col-span-7">
              <MonthlyExpenseTrend data={monthlyExpenseTrendData} />
              <div className="lg:hidden">
                <MonthlyHistory data={monthlyHistoryData} />
              </div>
            </div>

            <div className="hidden min-w-0 w-full lg:col-span-5 lg:block">
              <MonthlyHistory data={monthlyHistoryData} />
            </div>

            <section className="section-card min-w-0 w-full lg:hidden">
              <div className="mb-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">5 Transaksi Terbaru</h2>
                <Link
                  href={`/transactions?month=${selectedMonth}`}
                  className="text-sm font-semibold text-slate-700 underline underline-offset-4 dark:text-slate-200"
                >
                  Lihat semua
                </Link>
              </div>

            {error ? (
              <p className="text-rose-600">Error: {error.message}</p>
            ) : !transactions || transactions.length === 0 ? (
              <div>
                <p className="text-slate-600 dark:text-slate-300">
                  Belum ada transaksi di bulan ini.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/transactions/new" className="btn-primary">
                    + Tambah Transaksi
                  </Link>
                  <Link href={`/transactions?month=${selectedMonth}`} className="btn-secondary">
                    Lihat daftar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const category = Array.isArray(transaction.categories)
                    ? transaction.categories[0]
                    : transaction.categories;

                  return (
                    <div
                      key={transaction.id}
                      className="soft-inset flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {category?.name ?? "Tanpa kategori"}
                          </p>
                          <span className={transaction.type === "income" ? "chip-income" : "chip-expense"}>
                            {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 break-words dark:text-slate-300">
                          {transaction.note || "Tidak ada catatan"}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {formatDate(transaction.transaction_date)}
                        </p>
                      </div>

                      <p
                        className={`text-lg font-semibold sm:text-base ${
                          transaction.type === "income"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatRupiah(Number(transaction.amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            </section>
          </section>
        </MaskedAmountProvider>
      </div>
    </main>
  );
}

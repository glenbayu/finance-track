import Link from "next/link";
import { revalidatePath } from "next/cache";
import MonthlyExpenseTrend from "@/components/dashboard/monthly-expense-trend";
import QuickAddTransaction from "@/components/transactions/quick-add-transaction";
import TopSpendingInsight from "@/components/dashboard/top-spending-insight";
import ExpenseChart from "@/components/dashboard/expense-chart";
import MonthlyHistory from "@/components/dashboard/monthly-history";
import LogoutButton from "@/components/auth/logout-button";
import AppShell from "@/components/layout/app-shell";
import InteractiveDotPanel from "@/components/ui/interactive-dot-panel";
import { MaskedAmountProvider } from "@/components/ui/masked-amount";
import MaskedCurrencyAmount from "@/components/ui/masked-currency-amount";
import CurrencyAmount from "@/components/ui/currency-amount";
import MonthFilter from "@/components/ui/month-filter";
import { createTransactionFromTemplate, undoQuickAddTransaction } from "@/lib/actions/quick-add";
import { getCurrentDate, getCurrentMonth, getMonthRange, getPreviousMonth } from "@/lib/date";
import { formatDate as formatDateLabel } from "@/lib/format";
import { mapQuickAddTemplateRow, byTemplateSort } from "@/lib/quick-add";
import { requireUser } from "@/lib/supabase/auth";
import { ArrowUpRight, Wallet, Settings } from "lucide-react";

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
    .is("archived_at", null)
    .single();

  if (categoryError || !category) {
    throw new Error("Kategori tidak valid.");
  }

  const today = getCurrentDate();

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
  const today = getCurrentDate();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .is("archived_at", null)
    .order("name", { ascending: true });

  const { data: quickAddTemplates } = await supabase
    .from("quick_add_templates")
    .select(`
      id,
      user_id,
      name,
      type,
      category_id,
      amount,
      note,
      icon,
      color,
      is_active,
      sort_order,
      created_at,
      categories (
        name
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const activeTemplates = ((quickAddTemplates ?? []) as Record<string, unknown>[])
    .map(mapQuickAddTemplateRow)
    .sort(byTemplateSort);

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
      wallet_id,
      destination_wallet_id,
      categories (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .gte("transaction_date", start)
    .lt("transaction_date", end);

  const { data: allTimeTransactions } = await supabase
    .from("transactions")
    .select(`
      id,
      type,
      amount,
      wallet_id,
      destination_wallet_id
    `)
    .eq("user_id", user.id);

  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

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

  const walletBalances = {
    cash: 0,
    bank: 0,
    receivable: 0,
  };
  
  const walletTypeMap = new Map<string, string>();
  wallets?.forEach(w => walletTypeMap.set(w.id, w.type));

  allTransactions?.forEach((t) => {
    const amount = Number(t.amount);
    if (t.type === 'income' && t.wallet_id) {
      const type = walletTypeMap.get(t.wallet_id);
      if (type) walletBalances[type as keyof typeof walletBalances] += amount;
    } else if (t.type === 'expense' && t.wallet_id) {
      const type = walletTypeMap.get(t.wallet_id);
      if (type) walletBalances[type as keyof typeof walletBalances] -= amount;
    } else if (t.type === 'transfer') {
      if (t.wallet_id) {
        const type = walletTypeMap.get(t.wallet_id);
        if (type) walletBalances[type as keyof typeof walletBalances] -= amount;
      }
      if (t.destination_wallet_id) {
        const type = walletTypeMap.get(t.destination_wallet_id);
        if (type) walletBalances[type as keyof typeof walletBalances] += amount;
      }
    }
  });

  const totalNetWorth = walletBalances.cash + walletBalances.bank + walletBalances.receivable;

  type ExpenseGroup = {
    categoryId: string | null;
    amount: number;
    count: number;
    transactions: {
      id: string;
      amount: number;
      note: string | null;
      transaction_date: string | null;
    }[];
  };

  const expenseMap = new Map<
    string,
    ExpenseGroup
  >();

  allTransactions
    ?.filter((item) => item.type === "expense")
    .forEach((item) => {
      const category = Array.isArray(item.categories)
        ? item.categories[0]
        : item.categories;

      const categoryName = category?.name ?? "Tanpa kategori";
      const categoryId = category?.id ?? null;
      const current: ExpenseGroup = expenseMap.get(categoryName) ?? {
        categoryId,
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
    } else if (item.type === "expense") {
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
      .slice(0, 5) ?? [];

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="dashboard"
      month={selectedMonth}
      title="Finance Tracker"
      description="Dashboard untuk memantau arus kas dan pola pengeluaran bulanan."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <>
          <MonthFilter selectedMonth={selectedMonth} compact className="min-w-[170px]" />
          <Link href="/transactions/new" className="btn-primary h-10 px-5">
            + Transaksi
          </Link>
        </>
      }
      mobileActions={
        <>
          <div className="flex w-full min-w-0 items-center gap-2">
            <MonthFilter selectedMonth={selectedMonth} compact className="flex-1" />
            <LogoutButton
              iconOnly
              className="btn-secondary h-10 w-10 shrink-0 justify-center px-0"
            />
          </div>
          <QuickAddTransaction
            categories={categories ?? []}
            action={quickAddTransaction}
            templates={activeTemplates}
            today={today}
            createFromTemplateAction={createTransactionFromTemplate}
            undoFromTemplateAction={undoQuickAddTransaction}
          />
        </>
      }
    >
      <MaskedAmountProvider>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 lg:items-start [&>*]:min-w-0 [&>*]:w-full">
          <InteractiveDotPanel className="stat-card self-start h-fit">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Sisa Saldo Bulan Ini</p>
                <Link href="/wallets" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Atur Dompet">
                  <Settings size={14} />
                </Link>
              </div>
              <span className="rounded-full bg-slate-200 p-2 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <Wallet size={14} />
              </span>
            </div>
            <MaskedCurrencyAmount
              amountIDR={balance}
              valueClassName="text-2xl font-bold text-slate-900 dark:text-slate-100"
              maskedText="***"
              showLabel="Tampilkan saldo"
              hideLabel="Sembunyikan saldo"
            />
            
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400">Cash on Hand</span>
                <span className={`text-sm font-semibold ${walletBalances.cash < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  <CurrencyAmount amountIDR={walletBalances.cash} />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400">M-Bank/E-Wallet</span>
                <span className={`text-sm font-semibold ${walletBalances.bank < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  <CurrencyAmount amountIDR={walletBalances.bank} />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400">Saldo Tertahan</span>
                <span className={`text-sm font-semibold ${walletBalances.receivable < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  <CurrencyAmount amountIDR={walletBalances.receivable} />
                </span>
              </div>
            </div>
          </InteractiveDotPanel>

          <InteractiveDotPanel className="stat-card self-start h-fit">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pemasukan</p>
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <ArrowUpRight size={14} />
              </span>
            </div>
            <MaskedCurrencyAmount
              amountIDR={totalIncome}
              valueClassName="text-2xl font-bold text-emerald-600"
              maskedText="***"
              showToggle={false}
            />
          </InteractiveDotPanel>
        </section>

        <section className="mt-7 grid gap-6 lg:hidden [&>*]:min-w-0 [&>*]:w-full">
          <div className="min-w-0 w-full">
            <ExpenseChart data={expenseChartData} />
          </div>

          <div className="min-w-0 w-full">
            <TopSpendingInsight data={topSpendingData} totalExpense={totalExpense} />
          </div>

          <div className="min-w-0 w-full space-y-6">
            <MonthlyExpenseTrend data={monthlyExpenseTrendData} />
            <MonthlyHistory data={monthlyHistoryData} />
          </div>
        </section>

        <section className="mt-6 hidden gap-5 lg:grid lg:grid-cols-12 lg:items-start [&>*]:min-w-0 [&>*]:w-full">
          <div className="min-w-0 w-full self-start lg:col-span-7">
            <div className="space-y-5">
              <ExpenseChart data={expenseChartData} />
              <MonthlyExpenseTrend data={monthlyExpenseTrendData} />
            </div>
          </div>

          <div className="min-w-0 w-full self-start lg:col-span-5">
            <div className="space-y-5">
              <QuickAddTransaction
                categories={categories ?? []}
                action={quickAddTransaction}
                templates={activeTemplates}
                today={today}
                createFromTemplateAction={createTransactionFromTemplate}
                undoFromTemplateAction={undoQuickAddTransaction}
              />
              <TopSpendingInsight data={topSpendingData} totalExpense={totalExpense} />
            </div>
          </div>
        </section>

        <section className="mt-6 hidden lg:grid lg:grid-cols-12 lg:items-start [&>*]:min-w-0 [&>*]:w-full">
          <div className="lg:col-span-12">
            <MonthlyHistory data={monthlyHistoryData} />
          </div>
        </section>

        <InteractiveDotPanel className="section-card min-w-0 w-full mt-6 lg:hidden">
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
                          {formatDateLabel(transaction.transaction_date)}
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
                        <CurrencyAmount amountIDR={Number(transaction.amount)} absolute />
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
        </InteractiveDotPanel>
      </MaskedAmountProvider>
    </AppShell>
  );
}

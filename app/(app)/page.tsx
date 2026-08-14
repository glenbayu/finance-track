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
import { Suspense } from "react";
import { createTransactionFromTemplate, undoQuickAddTransaction } from "@/lib/transactions/quick-add-actions";
import { getCurrentDate, getCurrentMonth, getMonthRange, getPreviousMonth, getRecentMonths } from "@/lib/utils/date";
import { formatDate as formatDateLabel, formatMonthLabel } from "@/lib/utils/format";
import { mapQuickAddTemplateRow, byTemplateSort } from "@/lib/transactions/quick-add";
import { requireUser } from "@/lib/supabase/auth";
import { ArrowUpRight, Wallet, Settings, LayoutDashboard } from "lucide-react";
import { forceRecalculateRollovers } from "@/lib/transactions/rollover";
import SwipeableRow from "@/components/ui/swipeable-row";
import EditTransactionButton from "@/components/transactions/edit-transaction-button";
import DeleteTransactionButton from "@/components/transactions/delete-transaction-button";
import { deleteTransaction } from "@/app/(app)/transactions/actions";

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
  await forceRecalculateRollovers(supabase, user.id);
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
  const historyStart = getRecentMonths(6, selectedMonth)[0] ?? selectedMonth;
  const { start: historyStartDate } = getMonthRange(historyStart);

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

  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const { data: previousExpenses } = await supabase
    .from("transactions")
    .select(`
      id,
      amount,
      transaction_date,
      categories (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("transaction_date", previousStart)
    .lt("transaction_date", previousEnd);

  const { data: historyTransactions } = await supabase
    .from("transactions")
    .select("id, type, amount, transaction_date")
    .eq("user_id", user.id)
    .gte("transaction_date", historyStartDate)
    .lt("transaction_date", end);

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

  const totalIncome = allTransactions
    ?.filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;
  const totalExpense = allTransactions
    ?.filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;
  const balance = totalIncome - totalExpense;

  const walletBalanceMap = new Map<string, number>();
  wallets?.forEach((wallet) => walletBalanceMap.set(wallet.id, 0));

  allTransactions?.forEach((transaction) => {
    const amount = Number(transaction.amount);
    if (transaction.type === "income" && transaction.wallet_id) {
      walletBalanceMap.set(transaction.wallet_id, (walletBalanceMap.get(transaction.wallet_id) ?? 0) + amount);
    } else if (transaction.type === "expense" && transaction.wallet_id) {
      walletBalanceMap.set(transaction.wallet_id, (walletBalanceMap.get(transaction.wallet_id) ?? 0) - amount);
    } else if (transaction.type === "adjustment" && transaction.wallet_id) {
      walletBalanceMap.set(transaction.wallet_id, (walletBalanceMap.get(transaction.wallet_id) ?? 0) + amount);
    } else if (transaction.type === "transfer") {
      if (transaction.wallet_id) {
        walletBalanceMap.set(transaction.wallet_id, (walletBalanceMap.get(transaction.wallet_id) ?? 0) - amount);
      }
      if (transaction.destination_wallet_id) {
        walletBalanceMap.set(transaction.destination_wallet_id, (walletBalanceMap.get(transaction.destination_wallet_id) ?? 0) + amount);
      }
    }
  });

  const walletBalances = (wallets ?? []).reduce(
    (acc, wallet) => {
      const amount = walletBalanceMap.get(wallet.id) ?? 0;
      if (wallet.type === "cash") acc.cash += amount;
      else if (wallet.type === "receivable") acc.receivable += amount;
      else acc.bank += amount;
      return acc;
    },
    { cash: 0, bank: 0, receivable: 0 },
  );

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
    .slice(-8);

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

  const hour = new Date().getHours();
  let greeting = "Selamat Malam";
  if (hour < 11) greeting = "Selamat Pagi";
  else if (hour < 15) greeting = "Selamat Siang";
  else if (hour < 19) greeting = "Selamat Sore";

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  const firstName = fullName ? fullName.split(" ")[0] : user.email?.split("@")[0] || "Teman";

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="dashboard"
      month={selectedMonth}
      eyebrow="Ringkasan Bulanan"
      heroIcon={<LayoutDashboard size={19} strokeWidth={2.2} />}
      title={`${greeting}, ${firstName}`}
      description="Pantau arus kas dan pola pengeluaran bulananmu di sini."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <>
          <Suspense fallback={<div className="h-10 w-[170px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
            <MonthFilter selectedMonth={selectedMonth} compact className="min-w-[170px]" />
          </Suspense>
          <Link href="/transactions/new" className="btn-primary h-10 px-5 active:scale-95 transition-transform">
            + Transaksi
          </Link>
        </>
      }
      mobileActions={
        <div className="flex flex-col gap-3">
          <div className="flex w-full min-w-0 items-center gap-2">
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
              <MonthFilter selectedMonth={selectedMonth} compact className="flex-1" />
            </Suspense>
            <LogoutButton
              iconOnly
              className="btn-secondary h-10 w-10 shrink-0 justify-center px-0 active:scale-95 transition-transform"
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
        </div>
      }
    >
      {(!wallets || wallets.length === 0) && (
        <div className="mb-6 rounded-lg p-5" style={{ backgroundColor: "var(--lk-primary-dim)", border: "1px solid var(--lk-primary)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--lk-primary-light)" }}>Selamat Datang di Finance Journal! 🎉</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Kelihatannya kamu belum punya dompet (wallet) untuk mulai mencatat. Yuk, buat dompet pertamamu sekarang!
          </p>
          <Link href="/wallets/new" className="btn-primary mt-4 inline-flex">
            + Buat Dompet Pertama
          </Link>
        </div>
      )}

      <MaskedAmountProvider>
        {/* Mobile & Tablet Layout */}
        <div className="lg:hidden space-y-7">
          <section className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0 [&>*]:w-full">
            <InteractiveDotPanel className="stat-card self-start h-fit">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Sisa Saldo</p>
                  <Link href="/wallets" style={{ color: "var(--lk-text-muted)" }} className="hover:opacity-70 transition-opacity" title="Atur Dompet">
                    <Settings size={14} />
                  </Link>
                </div>
                <span className="rounded-md p-2" style={{ backgroundColor: "var(--lk-surface-hover)", color: "var(--lk-text-muted)" }}>
                  <Wallet size={14} />
                </span>
              </div>
              <MaskedCurrencyAmount
                amountIDR={balance}
                valueClassName="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                showLabel="Tampilkan saldo"
                hideLabel="Sembunyikan saldo"
              />

              <div className="mt-4 grid grid-cols-3 gap-2 pt-4" style={{ borderTop: "1px solid var(--lk-border)" }}>
                <div className="flex flex-col">
                  <span className="text-xs" style={{ color: "var(--lk-text-muted)" }}>Cash</span>
                  <span className="text-sm font-semibold" style={{ color: walletBalances.cash < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                    <MaskedCurrencyAmount amountIDR={walletBalances.cash} showToggle={false} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs" style={{ color: "var(--lk-text-muted)" }}>Bank/E-Wallet</span>
                  <span className="text-sm font-semibold" style={{ color: walletBalances.bank < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                    <MaskedCurrencyAmount amountIDR={walletBalances.bank} showToggle={false} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs" style={{ color: "var(--lk-text-muted)" }}>Tertahan</span>
                  <span className="text-sm font-semibold" style={{ color: walletBalances.receivable < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                    <MaskedCurrencyAmount amountIDR={walletBalances.receivable} showToggle={false} />
                  </span>
                </div>
              </div>
            </InteractiveDotPanel>

            <InteractiveDotPanel className="stat-card self-start h-fit">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Pemasukan</p>
                <span className="rounded-md p-2" style={{ backgroundColor: "var(--lk-income-bg)", color: "var(--lk-income)" }}>
                  <ArrowUpRight size={14} />
                </span>
              </div>
              <MaskedCurrencyAmount
                amountIDR={totalIncome}
                valueClassName="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                showToggle={false}
              />
            </InteractiveDotPanel>
          </section>

          <section className="grid gap-6 [&>*]:min-w-0 [&>*]:w-full">
            <div className="min-w-0 w-full">
              <ExpenseChart data={expenseChartData} />
            </div>

            <div className="min-w-0 w-full">
              <TopSpendingInsight data={topSpendingData} totalExpense={totalExpense} />
            </div>

            <div className="min-w-0 w-full space-y-6">
              <MonthlyExpenseTrend data={monthlyExpenseTrendData} />
            </div>
          </section>
        </div>

        {/* Desktop Bento Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4 mt-6 items-start">
          
          {/* Main Content Column (Left - col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Top Row: Balance & Income */}
            <div className="grid grid-cols-3 gap-4">
              {/* Tile 1: Main Balance */}
              <div className="bento-card col-span-2 flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--lk-text-muted)" }}>Sisa Saldo Bulan Ini</p>
                      <Link href="/wallets" style={{ color: "var(--lk-text-muted)" }} className="hover:text-[var(--lk-text)] transition-colors" title="Atur Dompet">
                        <Settings size={14} />
                      </Link>
                    </div>
                    <span className="rounded-lg p-2 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                      <Wallet size={16} />
                    </span>
                  </div>
                  <MaskedCurrencyAmount
                    amountIDR={balance}
                    valueClassName="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                    showLabel="Tampilkan saldo"
                    hideLabel="Sembunyikan saldo"
                  />
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 pt-5 border-t border-slate-100 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs mb-1" style={{ color: "var(--lk-text-muted)" }}>Cash on Hand</span>
                    <span className="text-sm font-semibold" style={{ color: walletBalances.cash < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                      <MaskedCurrencyAmount amountIDR={walletBalances.cash} showToggle={false} />
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs mb-1" style={{ color: "var(--lk-text-muted)" }}>M-Bank/E-Wallet</span>
                    <span className="text-sm font-semibold" style={{ color: walletBalances.bank < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                      <MaskedCurrencyAmount amountIDR={walletBalances.bank} showToggle={false} />
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs mb-1" style={{ color: "var(--lk-text-muted)" }}>Saldo Tertahan</span>
                    <span className="text-sm font-semibold" style={{ color: walletBalances.receivable < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                      <MaskedCurrencyAmount amountIDR={walletBalances.receivable} showToggle={false} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Tile 2: Pemasukan */}
              <div className="bento-card col-span-1 flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: "var(--lk-text-muted)" }}>Pemasukan</p>
                    <span className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <MaskedCurrencyAmount
                    amountIDR={totalIncome}
                    valueClassName="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                    showToggle={false}
                  />
                </div>
                
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs" style={{ color: "var(--lk-text-muted)" }}>Status Finansial</span>
                  <p className="text-sm font-semibold mt-1" style={{ color: totalIncome >= totalExpense ? "var(--lk-income)" : "var(--lk-expense)" }}>
                    {totalIncome >= totalExpense ? "Surplus Bulan Ini" : "Defisit Bulan Ini"}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Row: Pie Chart (50%) & Top Categories (50%) */}
            <div className="grid grid-cols-2 gap-4 items-start">
              {/* Tile 4: Pie Chart */}
              <div className="bento-card !p-0">
                <ExpenseChart data={expenseChartData} />
              </div>

              {/* Tile 5: Top Categories */}
              <div className="bento-card !p-0">
                <TopSpendingInsight data={topSpendingData} totalExpense={totalExpense} />
              </div>
            </div>

            {/* Bottom Row: Expense Trend - full width */}
            <div className="bento-card">
              <MonthlyExpenseTrend data={monthlyExpenseTrendData} />
            </div>

            
          </div>

          {/* Sidebar Column (Right - col-span-1) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Tile 3: Quick Add */}
            <div className="bento-card !p-0">
              <QuickAddTransaction
                categories={categories ?? []}
                action={quickAddTransaction}
                templates={activeTemplates}
                today={today}
                createFromTemplateAction={createTransactionFromTemplate}
                undoFromTemplateAction={undoQuickAddTransaction}
              />
            </div>

            {/* Monthly History (Moved from bottom left) */}
            <div className="bento-card !p-0">
              <MonthlyHistory data={monthlyHistoryData} />
            </div>
          </div>

        </div>




        <InteractiveDotPanel className="section-card min-w-0 w-full mt-6 lg:hidden">
          <div className="mb-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold" style={{ color: "var(--lk-text)" }}>5 Transaksi Terbaru</h2>
            <Link
              href={`/transactions?month=${selectedMonth}`}
              className="text-sm font-semibold underline underline-offset-4"
              style={{ color: "var(--lk-primary-light)" }}
            >
              Lihat semua
            </Link>
          </div>

          {error ? (
            <p className="text-rose-600">Error: {error.message}</p>
          ) : !transactions || transactions.length === 0 ? (
            <div className="rounded-2xl p-6 text-center border border-slate-200/50 bg-slate-50/50 dark:border-white/5 dark:bg-white/5">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <LayoutDashboard size={22} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Belum ada transaksi</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Catat pengeluaran atau pemasukan pertamamu di bulan {formatMonthLabel(selectedMonth)}.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/transactions/new" className="btn-primary py-2 px-4 text-xs font-bold">
                  + Tambah Transaksi
                </Link>
                <Link href={`/transactions?month=${selectedMonth}`} className="btn-secondary py-2 px-4 text-xs font-semibold">
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
                  <SwipeableRow
                    key={transaction.id}
                    actions={
                      <div className="flex h-full min-w-max items-stretch rounded-2xl overflow-hidden ml-3 border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <EditTransactionButton id={transaction.id} className="h-full px-5 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-100 dark:border-slate-800" label="Edit" />
                        <DeleteTransactionButton id={transaction.id} action={deleteTransaction} className="h-full px-5 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-500/10 dark:text-rose-400" label="Hapus" />
                      </div>
                    }
                  >
                    <div
                      className="soft-inset flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between w-full h-full"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold" style={{ color: "var(--lk-text)" }}>
                            {category?.name ?? "Tanpa kategori"}
                          </p>
                          <span className={transaction.type === "income" ? "chip-income" : "chip-expense"}>
                            {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </div>
                        <p className="text-sm break-words" style={{ color: "var(--lk-text-muted)" }}>
                          {transaction.note || "Tidak ada catatan"}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--lk-text-faint)" }}>
                          {formatDateLabel(transaction.transaction_date)}
                        </p>
                      </div>

                      <p
                        className="text-lg font-semibold sm:text-base"
                        style={{ color: transaction.type === "income" ? "var(--lk-income)" : "var(--lk-expense)" }}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        <CurrencyAmount amountIDR={Number(transaction.amount)} absolute />
                      </p>
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>
          )}
        </InteractiveDotPanel>
      </MaskedAmountProvider>
    </AppShell>
  );
}

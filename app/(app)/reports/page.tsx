import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import ReportsCharts from "@/components/reports/dynamic-reports-charts";
import CurrencyAmount from "@/components/ui/currency-amount";
import MonthFilter from "@/components/ui/month-filter";
import { Suspense } from "react";
import {
  addMonths,
  calculateCategoryForecast,
  calculateWeightedForecast,
  getCompleteMonthWindow,
  type CategoryForecastResult,
  type ForecastConfidence,
} from "@/lib/reports/forecast";
import { getCurrentDate, getCurrentMonth, getMonthRange, getPreviousMonth, getRecentMonths, isMonthValue } from "@/lib/utils/date";
import { formatDate, formatMonthLabel } from "@/lib/utils/format";
import { requireUser } from "@/lib/supabase/auth";
import { BarChart3 } from "lucide-react";

type ReportsPageProps = {
  searchParams?: Promise<{
    month?: string;
    trend?: string;
  }>;
};

type TransactionRow = {
  id: string;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at: string | null;
  category_id: string | null;
  categories:
    | {
        id?: string;
        name?: string;
      }
    | {
        id?: string;
        name?: string;
      }[]
    | null;
};

function getCategoryName(category: TransactionRow["categories"]) {
  if (!category) return "Tanpa kategori";
  if (Array.isArray(category)) return category[0]?.name ?? "Tanpa kategori";
  return category.name ?? "Tanpa kategori";
}

function parseYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function getDaysInMonth(monthValue: string) {
  if (!isMonthValue(monthValue)) return 30;
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function safePctChange(current: number, previous: number) {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function fmtChangeText(current: number, previous: number) {
  const delta = current - previous;
  const pct = safePctChange(current, previous);
  const direction = delta > 0 ? "naik" : delta < 0 ? "turun" : "tetap";
  return { delta, pct, direction };
}

function confidenceLabel(confidence: ForecastConfidence) {
  if (confidence === "medium") return "Medium";
  if (confidence === "medium-low") return "Medium-low";
  if (confidence === "low") return "Low";
  return "Butuh data";
}


export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const selectedMonth = isMonthValue(params?.month ?? "") ? (params?.month as string) : getCurrentMonth();
  const previousMonth = getPreviousMonth(selectedMonth);
  const currentMonthNow = getCurrentMonth();
  const today = getCurrentDate();


  const { start, end } = getMonthRange(selectedMonth);
  const { start: previousStart, end: previousEnd } = getMonthRange(previousMonth);
  const recapMonthWindow = getRecentMonths(12, selectedMonth); // Always fetch 12 months for client-side local toggle
  const trendStart = getMonthRange(recapMonthWindow[0] ?? selectedMonth).start;
  const trendEnd = getMonthRange(addMonths(selectedMonth, 1)).start;

  const forecastWindowCandidates = getCompleteMonthWindow(selectedMonth, 8);
  const forecastWindow = forecastWindowCandidates
    .filter((month) => month < currentMonthNow)
    .slice(-6);

  const historyStart = getMonthRange(forecastWindowCandidates[0] ?? selectedMonth).start;
  const historyEnd = trendEnd;

  const [currentResult, previousResult, trendResult, historyResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        `
        id,
        type,
        amount,
        note,
        transaction_date,
        created_at,
        category_id,
        categories (
          id,
          name
        )
      `,
      )
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lt("transaction_date", end)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(
        `
        id,
        type,
        amount,
        note,
        transaction_date,
        category_id,
        categories (
          id,
          name
        )
      `,
      )
      .eq("user_id", user.id)
      .gte("transaction_date", previousStart)
      .lt("transaction_date", previousEnd),
    supabase
      .from("transactions")
      .select("type, amount, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", trendStart)
      .lt("transaction_date", trendEnd),
    supabase
      .from("transactions")
      .select(
        `
        type,
        amount,
        transaction_date,
        categories (
          name
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("transaction_date", historyStart)
      .lt("transaction_date", historyEnd),
  ]);

  if (currentResult.error) throw new Error(`Gagal memuat laporan: ${currentResult.error.message}`);
  if (previousResult.error) throw new Error(`Gagal memuat pembanding: ${previousResult.error.message}`);
  if (trendResult.error) throw new Error(`Gagal memuat trend: ${trendResult.error.message}`);
  if (historyResult.error) throw new Error(`Gagal memuat history forecast: ${historyResult.error.message}`);

  const currentTransactions = (currentResult.data ?? []) as TransactionRow[];
  const previousTransactions = (previousResult.data ?? []) as TransactionRow[];
  const historyExpenses = (historyResult.data ?? []) as Array<{
    amount: number;
    transaction_date: string;
    categories:
      | {
          name?: string;
        }
      | {
          name?: string;
        }[]
      | null;
  }>;

  const totalIncome = currentTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = currentTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const netCashflow = totalIncome - totalExpense;
  const transactionCount = currentTransactions.length;
  const expenseTransactionCount = currentTransactions.filter((item) => item.type === "expense").length;
  const averageExpensePerTransaction = expenseTransactionCount > 0 ? totalExpense / expenseTransactionCount : 0;

  const previousIncome = previousTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const previousExpense = previousTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const previousNet = previousIncome - previousExpense;

  const incomeChange = fmtChangeText(totalIncome, previousIncome);
  const expenseChange = fmtChangeText(totalExpense, previousExpense);
  const netChange = fmtChangeText(netCashflow, previousNet);

  const currentExpenseByCategory = new Map<string, number>();
  currentTransactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const categoryName = getCategoryName(item.categories);
      currentExpenseByCategory.set(categoryName, (currentExpenseByCategory.get(categoryName) ?? 0) + Number(item.amount));
    });

  const expenseBreakdown = Array.from(currentExpenseByCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const biggestExpenseCategory = expenseBreakdown[0] ?? null;

  const largestExpenseTransaction = currentTransactions
    .filter((item) => item.type === "expense")
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0] ?? null;

  const expenseDayMap = new Map<string, { total: number; count: number }>();
  currentTransactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const current = expenseDayMap.get(item.transaction_date) ?? { total: 0, count: 0 };
      current.total += Number(item.amount);
      current.count += 1;
      expenseDayMap.set(item.transaction_date, current);
    });

  const highestSpendingDay = Array.from(expenseDayMap.entries())
    .sort((a, b) => b[1].total - a[1].total)[0] ?? null;
  const busiestSpendingDay = Array.from(expenseDayMap.entries())
    .sort((a, b) => b[1].count - a[1].count)[0] ?? null;

  const monthlyTrendMap = new Map<string, { month: string; income: number; expense: number; cashflow: number }>();
  recapMonthWindow.forEach((month) => {
    monthlyTrendMap.set(month, {
      month: formatMonthLabel(month),
      income: 0,
      expense: 0,
      cashflow: 0,
    });
  });

  (trendResult.data ?? []).forEach((row) => {
    if (!row.transaction_date) return;
    const monthKey = row.transaction_date.slice(0, 7);
    const current = monthlyTrendMap.get(monthKey);
    if (!current) return;
    if (row.type === "income") {
      current.income += Number(row.amount);
    } else if (row.type === "expense") {
      current.expense += Number(row.amount);
    }
    current.cashflow = current.income - current.expense;
  });

  const trendData = recapMonthWindow.map((month) => {
    const current = monthlyTrendMap.get(month);
    return (
      current ?? {
        month: formatMonthLabel(month),
        income: 0,
        expense: 0,
        cashflow: 0,
      }
    );
  });

  const forecastMonthlyMap = new Map<string, number>();
  historyExpenses.forEach((item) => {
    const month = item.transaction_date.slice(0, 7);
    forecastMonthlyMap.set(month, (forecastMonthlyMap.get(month) ?? 0) + Number(item.amount));
  });

  const monthlyValues = forecastWindow.map((month) => ({
    month,
    amount: forecastMonthlyMap.get(month) ?? 0,
  }));
  const spendingForecast = calculateWeightedForecast(monthlyValues);

  const categoryMonthMap = new Map<string, Map<string, number>>();
  historyExpenses.forEach((item) => {
    const month = item.transaction_date.slice(0, 7);
    if (!forecastWindow.includes(month)) return;
    const categoryRelation = Array.isArray(item.categories) ? item.categories[0] : item.categories;
    const categoryName = categoryRelation?.name ?? "Tanpa kategori";
    const current = categoryMonthMap.get(categoryName) ?? new Map<string, number>();
    current.set(month, (current.get(month) ?? 0) + Number(item.amount));
    categoryMonthMap.set(categoryName, current);
  });

  const rawCategoryForecast = calculateCategoryForecast({
    totalForecastAmount: spendingForecast.forecastAmount,
    monthsWindow: forecastWindow,
    categoryByMonth: categoryMonthMap,
  });

  const topCategoryForecast = rawCategoryForecast.slice(0, 5);
  const restForecast = rawCategoryForecast.slice(5);
  const othersTotal = restForecast.reduce((sum, item) => sum + item.forecastAmount, 0);
  const othersShare = restForecast.reduce((sum, item) => sum + item.share, 0);

  const categoryForecast: CategoryForecastResult[] = [...topCategoryForecast];
  if (othersTotal > 0) {
    categoryForecast.push({
      category: "Lainnya",
      forecastAmount: othersTotal,
      share: othersShare,
      confidence: "low",
      activeMonthCount: 1,
    });
  }

  const hasNoTransactions = currentTransactions.length === 0;
  const nextMonthLabel = formatMonthLabel(addMonths(selectedMonth, 1));

  const monthProjection = (() => {
    if (selectedMonth !== currentMonthNow) return null;
    const { day } = parseYmd(today);
    const daysInMonth = getDaysInMonth(selectedMonth);
    if (day <= 0) return null;
    const projected = (totalExpense / day) * daysInMonth;
    return {
      day,
      daysInMonth,
      projected,
    };
  })();

  const projectionVsForecastInsight = (() => {
    if (!monthProjection || spendingForecast.forecastAmount === null) return null;
    const delta = monthProjection.projected - spendingForecast.forecastAmount;
    const pct =
      spendingForecast.forecastAmount > 0
        ? (delta / spendingForecast.forecastAmount) * 100
        : null;
    const trendWord = delta >= 0 ? "lebih tinggi" : "lebih rendah";
    const pctText = pct === null ? "" : `${Math.abs(pct).toFixed(1)}% `;
    return {
      delta,
      message: `Bulan berjalan diproyeksikan ${pctText}${trendWord} dari estimasi bulan depan.`,
    };
  })();

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="reports"
      month={selectedMonth}
      eyebrow="Insight Keuangan"
      heroIcon={<BarChart3 size={19} strokeWidth={2.2} />}
      title="Laporan & Analisis"
      description="Lihat rekap bulanan, tren pengeluaran, dan estimasi bulan berikutnya berdasarkan data transaksi kamu."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <Suspense fallback={<div className="h-10 w-[170px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />}>
          <MonthFilter selectedMonth={selectedMonth} compact className="min-w-[170px]" />
        </Suspense>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900 grid sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/60">
        <article className="p-5 hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pemasukan</p>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400"><CurrencyAmount amountIDR={totalIncome} /></p>
        </article>
        <article className="p-5 hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pengeluaran</p>
          <p className="mt-2 text-[22px] font-bold tracking-tight text-rose-600 dark:text-rose-400"><CurrencyAmount amountIDR={totalExpense} /></p>
        </article>
        <article className="p-5 hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Cashflow</p>
          <p className={`mt-2 text-[22px] font-bold tracking-tight ${netCashflow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            <CurrencyAmount amountIDR={netCashflow} />
          </p>
        </article>
        <article className="p-5 hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jumlah Transaksi</p>
          <p className="mt-2 text-[22px] font-bold tracking-tight" style={{ color: "var(--lk-text)" }}>{transactionCount} <span className="text-sm font-normal" style={{ color: "var(--lk-text-muted)" }}>kali</span></p>
        </article>
      </section>

      <section className="section-card mt-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--lk-text)" }}>Bulan {formatMonthLabel(selectedMonth)}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Ringkasan bulan {formatMonthLabel(selectedMonth)} dan perbandingan dengan {formatMonthLabel(previousMonth)}.
          </p>
        </div>

        {hasNoTransactions ? (
          <div className="soft-inset">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Belum ada transaksi di bulan ini. Tambahkan transaksi dulu untuk melihat recap.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Link href="/transactions/new" className="btn-primary">+ Tambah Transaksi</Link>
              <Link href={`/transactions?month=${encodeURIComponent(selectedMonth)}`} className="btn-secondary">
                Buka Daftar Transaksi
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-lg shadow-sm grid md:grid-cols-2 xl:grid-cols-3" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Rata-rata pengeluaran per transaksi</p>
            <p className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>
              <CurrencyAmount amountIDR={averageExpensePerTransaction} />
            </p>
          </article>

          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Kategori expense terbesar</p>
            <p className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>
              {biggestExpenseCategory
                ? `${biggestExpenseCategory.name}`
                : "Belum ada"}
            </p>
            {biggestExpenseCategory && (
              <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lk-text-muted)" }}>
                Mewakili {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format((biggestExpenseCategory.value / Math.max(totalExpense, 1)) * 100)}% dari total
              </p>
            )}
          </article>

          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Transaksi pengeluaran terbesar</p>
            <p className="text-lg font-semibold" style={{ color: "var(--lk-expense)" }}>
              {largestExpenseTransaction ? <CurrencyAmount amountIDR={Number(largestExpenseTransaction.amount)} /> : "Belum ada"}
            </p>
            <p className="text-[11px] font-medium mt-1 line-clamp-1" style={{ color: "var(--lk-text-muted)" }}>
              {largestExpenseTransaction ? largestExpenseTransaction.note || getCategoryName(largestExpenseTransaction.categories) : "-"}
            </p>
          </article>

          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Hari pengeluaran tertinggi</p>
            <p className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>
              {highestSpendingDay ? `${formatDate(highestSpendingDay[0])}` : "Belum ada"}
            </p>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lk-text-muted)" }}>
              {highestSpendingDay ? <CurrencyAmount amountIDR={highestSpendingDay[1].total} /> : "-"}
            </p>
          </article>

          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Hari transaksi pengeluaran tersibuk</p>
            <p className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>
              {busiestSpendingDay ? `${formatDate(busiestSpendingDay[0])}` : "Belum ada"}
            </p>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lk-text-muted)" }}>
              {busiestSpendingDay ? `${busiestSpendingDay[1].count} transaksi dilakukan` : "-"}
            </p>
          </article>

          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Perubahan net cashflow</p>
            <div className="flex items-center gap-2">
              <span className={netChange.delta >= 0 ? "chip-income uppercase text-[10px]" : "chip-expense uppercase text-[10px]"}>
                {netChange.direction}
              </span>
              <p className="text-lg font-semibold" style={{ color: netChange.delta >= 0 ? "var(--lk-income)" : "var(--lk-expense)" }}>
                <CurrencyAmount amountIDR={netChange.delta} />
              </p>
            </div>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lk-text-muted)" }}>
              {netChange.pct === null ? "Persentase belum tersedia" : `${netChange.pct.toFixed(1)}% vs bulan lalu`}
            </p>
          </article>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg shadow-sm grid md:grid-cols-3" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Pemasukan vs bulan lalu</p>
            <p className="text-lg font-semibold" style={{ color: incomeChange.delta >= 0 ? "var(--lk-income)" : "var(--lk-expense)" }}>
              {incomeChange.delta >= 0 ? "+" : ""}<CurrencyAmount amountIDR={incomeChange.delta} />
            </p>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lk-text-muted)" }}>
              {incomeChange.pct === null ? "Persentase belum tersedia" : `${incomeChange.delta >= 0 ? "Naik" : "Turun"} ${Math.abs(incomeChange.pct).toFixed(1)}%`}
            </p>
          </article>
          
          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{ borderBottom: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Pengeluaran vs bulan lalu</p>
            <p className="text-lg font-semibold" style={{ color: expenseChange.delta <= 0 ? "var(--lk-income)" : "var(--lk-expense)" }}>
              {expenseChange.delta > 0 ? "+" : ""}<CurrencyAmount amountIDR={expenseChange.delta} />
            </p>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lk-text-muted)" }}>
              {expenseChange.pct === null ? "Persentase belum tersedia" : `${expenseChange.delta >= 0 ? "Naik" : "Turun"} ${Math.abs(expenseChange.pct).toFixed(1)}%`}
            </p>
          </article>
          
          <article className="p-4 flex flex-col justify-between hover-bg-surface-hover transition-colors" style={{
            borderBottom: "1px solid var(--lk-border)",
            borderRight: "1px solid var(--lk-border)",
            backgroundColor: totalExpense > totalIncome ? "var(--lk-expense-dim)" : "transparent"
          }}>
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--lk-text-muted)" }}>Status bulan ini</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 mt-0.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`} style={{ backgroundColor: totalExpense > totalIncome ? "var(--lk-expense)" : "var(--lk-income)" }}></span>
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: totalExpense > totalIncome ? "var(--lk-expense)" : "var(--lk-income)" }}></span>
              </span>
              <p className="text-lg font-semibold" style={{ color: totalExpense > totalIncome ? "var(--lk-expense)" : "var(--lk-income)" }}>
                {totalExpense > totalIncome ? "Defisit" : "Surplus"}
              </p>
            </div>
            <p className="text-[11px] font-medium mt-1 line-clamp-1" style={{ color: "var(--lk-text-muted)" }}>
              {totalExpense > totalIncome ? "Pengeluaran melebihi pemasukan!" : "Keuangan dalam kondisi sehat"}
            </p>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <ReportsCharts
          trendData={trendData}
          categoryData={expenseBreakdown}
          forecastCategoryData={categoryForecast}
          trendMonths={12}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-12">
        <article className="rounded-lg p-5 shadow-sm xl:col-span-5" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>Estimasi Pengeluaran</h3>
          {spendingForecast.forecastAmount === null ? (
            <div className="mt-3 rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
              <p className="font-semibold" style={{ color: "var(--lk-text)" }}>Butuh lebih banyak data.</p>
              <p className="mt-1 text-sm" style={{ color: "var(--lk-text-muted)" }}>
                Estimasi butuh minimal 2 bulan pengeluaran yang sudah selesai.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Estimasi pengeluaran bulan {nextMonthLabel}</p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--lk-expense)" }}>
                  <CurrencyAmount amountIDR={spendingForecast.forecastAmount} />
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    Histori: {spendingForecast.monthCount} bulan
                  </span>
                  {spendingForecast.monthCount < 4 ? (
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/40">
                      Akurasi Rendah
                    </span>
                  ) : spendingForecast.monthCount <= 5 ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40">
                      Akurasi Sedang
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/40">
                      Akurasi Stabil
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--lk-text-muted)" }}>
                  Metode: weighted moving average (bobot lebih tinggi pada bulan-bulan terdekat).
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                <p className="text-xs" style={{ color: "var(--lk-text-muted)", lineHeight: "1.4" }}>
                  💡 <strong>Info Estimasi:</strong> Estimasi ini dihitung secara matematis menggunakan data histori transaksi pengeluaran. Ini bukan angka pasti, melainkan proyeksi tren pengeluaran Anda berikutnya. Akurasi akan meningkat seiring bertambahnya data bulanan yang lengkap.
                </p>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-lg p-5 shadow-sm xl:col-span-4" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>Catatan Estimasi</h3>
          <div className="mt-3 rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
            <ul className="space-y-2 text-sm" style={{ color: "var(--lk-text-muted)" }}>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                <span>Estimasi menggunakan data pengeluaran dari bulan-bulan yang sudah selesai.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                <span>Bulan berjalan tidak dipakai sebagai dasar utama karena datanya belum lengkap.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                <span>Semakin banyak data bulanan, estimasi akan semakin stabil.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                <span>Kategori yang jarang muncul diberi tingkat akurasi lebih rendah.</span>
              </li>
            </ul>
          </div>
        </article>

        <article className="rounded-lg p-5 shadow-sm xl:col-span-3" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>Proyeksi Bulan Ini</h3>
          {monthProjection ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                <p style={{ color: "var(--lk-text-muted)" }}>Pengeluaran sejauh ini</p>
                <p className="mt-1 font-semibold" style={{ color: "var(--lk-expense)" }}><CurrencyAmount amountIDR={totalExpense} /></p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                <p style={{ color: "var(--lk-text-muted)" }}>Proyeksi pengeluaran akhir bulan</p>
                <p className="mt-1 font-semibold" style={{ color: "var(--lk-text)" }}>
                  <CurrencyAmount amountIDR={monthProjection.projected} />
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--lk-text-muted)" }}>
                  Hari ke-{monthProjection.day} dari {monthProjection.daysInMonth}
                </p>
              </div>
              {projectionVsForecastInsight ? (
                <div className="rounded-lg p-4" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                  <p style={{ color: "var(--lk-text-muted)" }}>Perbandingan proyeksi vs estimasi</p>
                  <p className="mt-1 font-semibold" style={{ color: projectionVsForecastInsight.delta >= 0 ? "var(--lk-expense)" : "var(--lk-income)" }}>
                    <CurrencyAmount amountIDR={projectionVsForecastInsight.delta} />
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--lk-text-muted)" }}>
                    {projectionVsForecastInsight.message}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: "var(--lk-text-muted)" }}>
              Proyeksi aktif saat melihat bulan berjalan.
            </p>
          )}
        </article>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2 [&>*]:min-w-0 [&>*]:max-w-full">
        <article className="rounded-lg p-5 shadow-sm min-w-0 w-full max-w-full overflow-hidden" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>Category Forecast (Top)</h3>
          {!categoryForecast.length ? (
            <p className="mt-3 text-sm" style={{ color: "var(--lk-text-muted)" }}>Forecast kategori belum tersedia.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {categoryForecast.map((item) => (
                <div key={item.category} className="rounded-lg p-3 flex min-w-0 items-start justify-between gap-2 overflow-hidden" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold" style={{ color: "var(--lk-text)" }}>{item.category}</p>
                    <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
                      {(item.share * 100).toFixed(1)}% kontribusi - {confidenceLabel(item.confidence)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold sm:hidden" style={{ color: "var(--lk-expense)" }}>
                      <CurrencyAmount amountIDR={item.forecastAmount} compact />
                    </p>
                    <p className="hidden font-semibold sm:block" style={{ color: "var(--lk-expense)" }}>
                      <CurrencyAmount amountIDR={item.forecastAmount} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-lg p-5 shadow-sm min-w-0 w-full max-w-full overflow-hidden" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--lk-text)" }}>Aktivitas Terkini</h3>
          {!currentTransactions.length ? (
            <p className="mt-3 text-sm" style={{ color: "var(--lk-text-muted)" }}>Belum ada transaksi pada bulan ini.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {currentTransactions.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-lg p-3 min-w-0 overflow-hidden" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border)" }}>
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium" style={{ color: "var(--lk-text)" }}>{getCategoryName(item.categories)}</p>
                      <p className="truncate text-sm" style={{ color: "var(--lk-text-muted)" }}>{item.note || "Tanpa catatan"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold sm:hidden" style={{ color: item.type === "income" ? "var(--lk-income)" : "var(--lk-expense)" }}>
                        {item.type === "income" ? "+" : "-"}
                        <CurrencyAmount amountIDR={Number(item.amount)} absolute compact />
                      </p>
                      <p className="hidden font-semibold sm:block" style={{ color: item.type === "income" ? "var(--lk-income)" : "var(--lk-expense)" }}>
                        {item.type === "income" ? "+" : "-"}
                        <CurrencyAmount amountIDR={Number(item.amount)} absolute />
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate text-xs" style={{ color: "var(--lk-text-muted)" }}>{formatDate(item.transaction_date)}</p>
                    <p className="shrink-0 text-[11px]" style={{ color: "var(--lk-text-muted)" }}>
                      {item.type === "income" ? "Pemasukan" : "Pengeluaran"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </AppShell>
  );
}




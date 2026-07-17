import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import ReportsCharts from "@/components/reports/reports-charts";
import CurrencyAmount from "@/components/ui/currency-amount";
import MonthFilter from "@/components/ui/month-filter";
import {
  addMonths,
  calculateCategoryForecast,
  calculateWeightedForecast,
  getCompleteMonthWindow,
  getForecastConfidence,
  type CategoryForecastResult,
  type ForecastConfidence,
} from "@/lib/reports/forecast";
import { getCurrentDate, getCurrentMonth, getMonthRange, getPreviousMonth, getRecentMonths, isMonthValue } from "@/lib/date";
import { formatDate, formatMonthLabel } from "@/lib/format";
import { requireUser } from "@/lib/supabase/auth";

type ReportsPageProps = {
  searchParams?: Promise<{
    month?: string;
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

function confidenceClass(confidence: ForecastConfidence) {
  if (confidence === "medium") return "chip-income";
  if (confidence === "medium-low") return "chip-neutral";
  if (confidence === "low") return "chip-expense";
  return "chip-neutral";
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
  const recapMonthWindow = getRecentMonths(6, selectedMonth);
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
      title="Reports & Analytics"
      description="Lihat rekap bulanan, tren pengeluaran, dan estimasi bulan berikutnya berdasarkan data transaksi kamu."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <MonthFilter selectedMonth={selectedMonth} compact className="min-w-[170px]" />
      }
      mobileActions={<MonthFilter selectedMonth={selectedMonth} compact className="w-full" />}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Income</p>
          <p className="mt-2 text-xl font-semibold text-emerald-600"><CurrencyAmount amountIDR={totalIncome} /></p>
        </article>
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Expense</p>
          <p className="mt-2 text-xl font-semibold text-rose-600"><CurrencyAmount amountIDR={totalExpense} /></p>
        </article>
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Net Cashflow</p>
          <p className={`mt-2 text-xl font-semibold ${netCashflow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            <CurrencyAmount amountIDR={netCashflow} />
          </p>
        </article>
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Jumlah Transaksi</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{transactionCount}</p>
        </article>
      </section>

      <section className="section-card mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Monthly Recap</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Rata-rata expense per transaksi</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              <CurrencyAmount amountIDR={averageExpensePerTransaction} />
            </p>
          </article>

          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Kategori expense terbesar</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {biggestExpenseCategory
                ? `${biggestExpenseCategory.name} (${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format((biggestExpenseCategory.value / Math.max(totalExpense, 1)) * 100)}%)`
                : "Belum ada"}
            </p>
          </article>

          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Transaksi expense terbesar</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {largestExpenseTransaction ? <CurrencyAmount amountIDR={Number(largestExpenseTransaction.amount)} /> : "Belum ada"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {largestExpenseTransaction ? largestExpenseTransaction.note || getCategoryName(largestExpenseTransaction.categories) : "-"}
            </p>
          </article>

          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Hari pengeluaran tertinggi</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {highestSpendingDay ? `${formatDate(highestSpendingDay[0])}` : "Belum ada"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {highestSpendingDay ? <CurrencyAmount amountIDR={highestSpendingDay[1].total} /> : "-"}
            </p>
          </article>

          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Hari transaksi expense tersibuk</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {busiestSpendingDay ? `${formatDate(busiestSpendingDay[0])}` : "Belum ada"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {busiestSpendingDay ? `${busiestSpendingDay[1].count} transaksi` : "-"}
            </p>
          </article>

          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Perubahan net cashflow</p>
            <p className={`font-semibold ${netChange.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {netChange.direction.toUpperCase()} <CurrencyAmount amountIDR={netChange.delta} />
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {netChange.pct === null ? "Persentase belum tersedia" : `${netChange.pct.toFixed(1)}% vs bulan lalu`}
            </p>
          </article>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Income vs bulan lalu</p>
            <p className={`font-semibold ${incomeChange.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <CurrencyAmount amountIDR={incomeChange.delta} />
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {incomeChange.pct === null ? "Persentase belum tersedia" : `${incomeChange.pct.toFixed(1)}%`}
            </p>
          </article>
          <article className="soft-inset space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Expense vs bulan lalu</p>
            <p className={`font-semibold ${expenseChange.delta <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <CurrencyAmount amountIDR={expenseChange.delta} />
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {expenseChange.pct === null ? "Persentase belum tersedia" : `${expenseChange.pct.toFixed(1)}%`}
            </p>
          </article>
          <article className={`soft-inset space-y-2 ${totalExpense > totalIncome ? "border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20" : ""}`}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Status bulan ini</p>
            <p className={`font-semibold ${totalExpense > totalIncome ? "text-rose-600" : "text-emerald-600"}`}>
              {totalExpense > totalIncome ? "Waspada: expense > income" : "Aman: cashflow masih positif"}
            </p>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <ReportsCharts
          trendData={trendData}
          categoryData={expenseBreakdown}
          forecastCategoryData={categoryForecast}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-12">
        <article className="section-card xl:col-span-5">
          <h3 className="text-lg font-semibold">Spending Forecast</h3>
          {spendingForecast.forecastAmount === null ? (
            <div className="mt-3 soft-inset">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Butuh lebih banyak data.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Forecast butuh minimal 2 bulan expense yang sudah selesai.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="soft-inset">
                <p className="text-sm text-slate-500 dark:text-slate-400">Estimasi expense bulan {nextMonthLabel}</p>
                <p className="mt-1 text-2xl font-semibold text-rose-600">
                  <CurrencyAmount amountIDR={spendingForecast.forecastAmount} />
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Dihitung dari {spendingForecast.monthCount} bulan terakhir yang sudah selesai.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Metode: weighted moving average.
                </p>
              </div>
              <div className="soft-inset flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Confidence</span>
                <span className={confidenceClass(spendingForecast.confidence)}>
                  {confidenceLabel(getForecastConfidence(spendingForecast.monthCount))}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estimasi dihitung dari transaksi expense yang sudah tersimpan. Akurasi akan membaik seiring bertambahnya data.
              </p>
            </div>
          )}
        </article>

        <article className="section-card xl:col-span-4">
          <h3 className="text-lg font-semibold">Forecast Notes</h3>
          <div className="mt-3 soft-inset">
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span>Forecast menggunakan data expense dari bulan-bulan yang sudah selesai.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span>Bulan berjalan tidak dipakai sebagai dasar utama karena datanya belum lengkap.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span>Semakin banyak data bulanan, estimasi akan semakin stabil.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span>Kategori yang jarang muncul diberi confidence lebih rendah.</span>
              </li>
            </ul>
          </div>
        </article>

        <article className="section-card xl:col-span-3">
          <h3 className="text-lg font-semibold">Current Month Projection</h3>
          {monthProjection ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="soft-inset">
                <p className="text-slate-500 dark:text-slate-400">Expense so far</p>
                <p className="mt-1 font-semibold text-rose-600"><CurrencyAmount amountIDR={totalExpense} /></p>
              </div>
              <div className="soft-inset">
                <p className="text-slate-500 dark:text-slate-400">Projected end-of-month expense</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  <CurrencyAmount amountIDR={monthProjection.projected} />
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Hari ke-{monthProjection.day} dari {monthProjection.daysInMonth}
                </p>
              </div>
              {projectionVsForecastInsight ? (
                <div className="soft-inset">
                  <p className="text-slate-500 dark:text-slate-400">Perbandingan proyeksi vs forecast</p>
                  <p className={`mt-1 font-semibold ${projectionVsForecastInsight.delta >= 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    <CurrencyAmount amountIDR={projectionVsForecastInsight.delta} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {projectionVsForecastInsight.message}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Proyeksi aktif saat melihat bulan berjalan.
            </p>
          )}
        </article>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2 [&>*]:min-w-0 [&>*]:max-w-full">
        <article className="section-card min-w-0 w-full max-w-full overflow-hidden">
          <h3 className="text-lg font-semibold">Category Forecast (Top)</h3>
          {!categoryForecast.length ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Forecast kategori belum tersedia.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {categoryForecast.map((item) => (
                <div key={item.category} className="soft-inset flex min-w-0 items-start justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{item.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(item.share * 100).toFixed(1)}% kontribusi - {confidenceLabel(item.confidence)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-rose-600 sm:hidden">
                      <CurrencyAmount amountIDR={item.forecastAmount} compact />
                    </p>
                    <p className="hidden font-semibold text-rose-600 sm:block">
                      <CurrencyAmount amountIDR={item.forecastAmount} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="section-card min-w-0 w-full max-w-full overflow-hidden">
          <h3 className="text-lg font-semibold">Aktivitas Terkini</h3>
          {!currentTransactions.length ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Belum ada transaksi pada bulan ini.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {currentTransactions.slice(0, 5).map((item) => (
                <div key={item.id} className="soft-inset min-w-0 overflow-hidden">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{getCategoryName(item.categories)}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{item.note || "Tanpa catatan"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-semibold ${item.type === "income" ? "text-emerald-600" : "text-rose-600"} sm:hidden`}>
                        {item.type === "income" ? "+" : "-"}
                        <CurrencyAmount amountIDR={Number(item.amount)} absolute compact />
                      </p>
                      <p className={`hidden font-semibold ${item.type === "income" ? "text-emerald-600" : "text-rose-600"} sm:block`}>
                        {item.type === "income" ? "+" : "-"}
                        <CurrencyAmount amountIDR={Number(item.amount)} absolute />
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{formatDate(item.transaction_date)}</p>
                    <p className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
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




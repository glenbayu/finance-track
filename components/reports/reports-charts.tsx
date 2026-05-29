"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { convertFromIDR, formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import type { CategoryForecastResult } from "@/lib/reports/forecast";

export type ReportsTrendItem = {
  month: string;
  income: number;
  expense: number;
  cashflow: number;
};

export type ReportsCategoryItem = {
  name: string;
  value: number;
};

type ReportsChartsProps = {
  trendData: ReportsTrendItem[];
  categoryData: ReportsCategoryItem[];
  forecastCategoryData: CategoryForecastResult[];
};

const CATEGORY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

function compactCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function shortMonthLabel(label: string) {
  const parts = label.trim().split(/\s+/);
  if (parts.length < 2) return label;

  const monthRaw = parts[0] ?? "";
  const yearRaw = parts[parts.length - 1] ?? "";
  const month = monthRaw.length > 3 ? monthRaw.slice(0, 3) : monthRaw;
  const year2 = yearRaw.length >= 2 ? yearRaw.slice(-2) : yearRaw;

  return `${month} ${year2}`;
}

function compactValue(value: number, currencySymbol: string) {
  const formatted = new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/\s+/g, "");
  return `${currencySymbol}${formatted}`;
}

export default function ReportsCharts({
  trendData,
  categoryData,
  forecastCategoryData,
}: ReportsChartsProps) {
  const { effectiveCurrency, rateFromIDR } = useDisplayCurrency();

  const convertedTrendData = trendData.map((item) => ({
    ...item,
    income: convertFromIDR(item.income, effectiveCurrency, rateFromIDR),
    expense: convertFromIDR(item.expense, effectiveCurrency, rateFromIDR),
    cashflow: convertFromIDR(item.cashflow, effectiveCurrency, rateFromIDR),
  }));

  const convertedCategoryData = categoryData.map((item) => ({
    ...item,
    value: convertFromIDR(item.value, effectiveCurrency, rateFromIDR),
  }));

  const forecastBars = forecastCategoryData.map((item) => ({
    name: item.category,
    value: convertFromIDR(item.forecastAmount, effectiveCurrency, rateFromIDR),
  }));
  const currencySymbol = getCurrencySymbol(effectiveCurrency);
  const maxForecastValue = forecastBars.reduce((max, item) => Math.max(max, item.value), 0);

  return (
    <>
      <article className="section-card min-w-0 max-w-full overflow-hidden lg:col-span-7">
        <h2 className="text-lg font-semibold">Trend Pemasukan vs Pengeluaran</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pergerakan bulanan berdasarkan data transaksi tersimpan.
        </p>

        {!trendData.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Belum ada data trend.</p>
        ) : (
          <div className="mt-4 h-[280px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convertedTrendData}>
                <CartesianGrid stroke="var(--stroke)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "var(--foreground)" }} />
                <YAxis
                  tickFormatter={compactCurrency}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--foreground)" }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0), effectiveCurrency)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--stroke)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className="section-card min-w-0 max-w-full overflow-hidden lg:col-span-5">
        <h2 className="text-lg font-semibold">Komposisi Pengeluaran Kategori</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Distribusi kategori pada bulan terpilih.
        </p>

        {!convertedCategoryData.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Belum ada pengeluaran pada bulan ini.
          </p>
        ) : (
          <div className="mt-3 h-[280px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={convertedCategoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={2}
                >
                  {convertedCategoryData.map((_, index) => (
                    <Cell key={`reports-category-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0), effectiveCurrency)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--stroke)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className="section-card min-w-0 max-w-full overflow-hidden lg:col-span-7">
        <h2 className="text-lg font-semibold">Trend Cashflow</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Nilai positif berarti pemasukan lebih besar dari pengeluaran.
        </p>

        {!convertedTrendData.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Belum ada data cashflow.</p>
        ) : (
          <div className="mt-4 h-[240px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={convertedTrendData}>
                <CartesianGrid stroke="var(--stroke)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={shortMonthLabel}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--foreground)" }}
                />
                <YAxis
                  tickFormatter={compactCurrency}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--foreground)" }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0), effectiveCurrency)}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--stroke)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                />
                <Bar dataKey="cashflow" radius={[8, 8, 0, 0]}>
                  {convertedTrendData.map((item) => (
                    <Cell key={item.month} fill={item.cashflow >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className="section-card min-w-0 max-w-full overflow-hidden lg:col-span-5">
        <h2 className="text-lg font-semibold">Forecast per Kategori</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Estimasi kategori expense bulan berikutnya.
        </p>

        {!forecastBars.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Forecast kategori belum tersedia.
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-2 sm:hidden">
              {forecastBars.map((item) => {
                const ratio = maxForecastValue > 0 ? Math.max(0, Math.min(100, (item.value / maxForecastValue) * 100)) : 0;
                return (
                  <div key={item.name} className="soft-inset min-w-0 overflow-hidden">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </p>
                      <p className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {compactValue(item.value, currencySymbol)}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/85 dark:bg-slate-700/85">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 hidden h-[260px] w-full min-w-0 overflow-hidden sm:block">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={forecastBars}
                  margin={{ top: 4, right: 12, left: 10, bottom: 4 }}
                >
                  <CartesianGrid stroke="var(--stroke)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={compactCurrency} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "var(--foreground)" }} />
                  <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "var(--foreground)" }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0), effectiveCurrency)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--stroke)",
                      backgroundColor: "var(--surface)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#0ea5a5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </article>
    </>
  );
}

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

type TrendTooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
  color?: string;
};

type TrendTooltipProps = {
  active?: boolean;
  payload?: TrendTooltipEntry[];
  label?: string | number;
  coordinate?: {
    x?: number;
    y?: number;
  };
  viewBox?: {
    width?: number;
    height?: number;
  };
  currencySymbol: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function CustomTooltip({
  active,
  payload,
  label,
  coordinate,
  viewBox,
  currencySymbol,
}: TrendTooltipProps) {
  if (!active || !payload?.length) return null;

  const chartWidth = Number(viewBox?.width ?? 240);
  const chartHeight = Number(viewBox?.height ?? 280);
  const pointX = Number(coordinate?.x ?? chartWidth / 2);
  const pointY = Number(coordinate?.y ?? chartHeight / 2);

  const tooltipWidth = Math.min(180, Math.max(140, chartWidth - 16));
  const tooltipHeight = Math.min(90, Math.max(72, 44 + payload.length * 22));
  const gap = 12;
  const padding = 8;

  const canPlaceRight = pointX + gap + tooltipWidth <= chartWidth - padding;
  const canPlaceLeft = pointX - gap - tooltipWidth >= padding;
  const canPlaceBelow = pointY + gap + tooltipHeight <= chartHeight - padding;
  const canPlaceAbove = pointY - gap - tooltipHeight >= padding;

  const left = clamp(
    canPlaceRight
      ? pointX + gap
      : canPlaceLeft
        ? pointX - tooltipWidth - gap
        : pointX - tooltipWidth / 2,
    padding,
    chartWidth - tooltipWidth - padding,
  );

  const top = clamp(
    canPlaceBelow
      ? pointY + gap
      : canPlaceAbove
        ? pointY - tooltipHeight - gap
        : pointY - tooltipHeight / 2,
    padding,
    chartHeight - tooltipHeight - padding,
  );

  return (
    <div
      style={{
        left,
        top,
        width: tooltipWidth,
        minHeight: tooltipHeight,
        borderRadius: 12,
        border: "1px solid var(--stroke)",
        background: "var(--surface)",
        color: "var(--foreground)",
      }}
      className="pointer-events-none absolute z-30 p-3 shadow-lg"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Bulan: {shortMonthLabel(String(label ?? ""))}
      </p>

      <div className="space-y-1.5">
        {(payload as TrendTooltipEntry[]).map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? "#10b981" }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold">
              {compactValue(Number(entry.value ?? 0), currencySymbol)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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
          <div className="relative mt-4 h-[280px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={convertedTrendData}
                accessibilityLayer={false}
                margin={{
                  top: 10,
                  right: 10,
                  left: 15,
                  bottom: 5,
                }}>
                <CartesianGrid stroke="var(--stroke)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={shortMonthLabel}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--foreground)" }}
                  minTickGap={12}
                />
                <YAxis
                  tickFormatter={compactCurrency}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--foreground)" }}
                />
                <Tooltip
                  content={<CustomTooltip currencySymbol={currencySymbol} />}
                  wrapperStyle={{ pointerEvents: "none", zIndex: 30 }}
                  cursor={{ stroke: "var(--stroke)", strokeDasharray: "4 4" }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={2.6}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--surface)" }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Pengeluaran"
                  stroke="#ef4444"
                  strokeWidth={2.6}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--surface)" }}
                />
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
              <PieChart accessibilityLayer={false}>
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
              <BarChart data={convertedTrendData} accessibilityLayer={false}>
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
                  accessibilityLayer={false}
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

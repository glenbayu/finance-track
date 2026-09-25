"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { convertFromIDR, formatCurrency, getCurrencySymbol } from "@/lib/utils/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import type { CategoryForecastResult } from "@/lib/reports/forecast";
import { useAmountPrivacy } from "@/hooks/use-amount-privacy";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import CurrencyAmount from "@/components/ui/currency-amount";
import styles from "./reports-charts.module.css";

export type ReportsTrendItem = {
  month: string;
  income: number;
  expense: number;
  cashflow: number;
};

type ReportsChartsProps = {
  trendData: ReportsTrendItem[];
  forecastCategoryData: CategoryForecastResult[];
  trendMonths: number;
};

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
  const isAndroid = typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

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
      }}
      className={`pointer-events-none absolute z-30 p-3 shadow-md border border-slate-200/50 ${
        isAndroid
          ? "bg-white dark:bg-[#0a0c10]"
          : "bg-white/75 backdrop-blur-md dark:border-white/5 dark:bg-[#0a0c10]/75"
      }`}
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Bulan: {shortMonthLabel(String(label ?? ""))}
      </p>

      <div className="space-y-1.5">
        {(payload as TrendTooltipEntry[]).map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? "#10b981" }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
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
  forecastCategoryData,
  trendMonths,
}: ReportsChartsProps) {
  const { effectiveCurrency, rateFromIDR } = useDisplayCurrency();
  const { isHiddenByDefault } = useAmountPrivacy();
  const reducedMotion = useReducedMotion();
  const isAndroid = typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const [mounted, setMounted] = useState(false);
  const [localTrendMonths, setLocalTrendMonths] = useState(trendMonths);
  const [visibleLines, setVisibleLines] = useState({ income: true, expense: true });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const visibleTrendData = trendData.slice(-localTrendMonths);
  const rangeIndex = [6, 10, 12].indexOf(localTrendMonths);

  const convertedTrendData = visibleTrendData.map((item) => ({
    ...item,
    income: convertFromIDR(item.income, effectiveCurrency, rateFromIDR),
    expense: convertFromIDR(item.expense, effectiveCurrency, rateFromIDR),
    cashflow: convertFromIDR(item.cashflow, effectiveCurrency, rateFromIDR),
  }));

  const forecastBars = forecastCategoryData.map((item) => ({
    name: item.category,
    value: convertFromIDR(item.forecastAmount, effectiveCurrency, rateFromIDR),
  }));
  const currencySymbol = getCurrencySymbol(effectiveCurrency);
  const maxForecastValue = forecastBars.reduce((max, item) => Math.max(max, item.value), 0);


  return (
    <>
      <details className="section-card lg:col-span-12">
        <summary className="cursor-pointer py-2 font-medium">Lihat tabel data laporan</summary>
        <div className="overflow-x-auto"><table className="chart-data"><caption className="sr-only">Pemasukan, pengeluaran, dan arus kas bulanan</caption><thead><tr><th scope="col">Bulan</th><th scope="col">Pemasukan</th><th scope="col">Pengeluaran</th><th scope="col">Arus kas</th></tr></thead><tbody>{visibleTrendData.map((item) => <tr key={item.month}><th scope="row">{item.month}</th><td><CurrencyAmount amountIDR={item.income} /></td><td><CurrencyAmount amountIDR={item.expense} /></td><td><CurrencyAmount amountIDR={item.cashflow} /></td></tr>)}</tbody></table></div>
      </details>
      <article className="section-card min-w-0 max-w-full overflow-hidden lg:col-span-12">
        <h2 className="text-lg font-semibold">Trend Pemasukan vs Pengeluaran</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pergerakan bulanan berdasarkan data transaksi tersimpan.
          </p>
          <div className={styles.rangeFilter} aria-label="Rentang waktu grafik" style={{ "--range-index": rangeIndex } as React.CSSProperties}>
            <span className={styles.rangeIndicator} aria-hidden="true" />
            {[6, 10, 12].map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setLocalTrendMonths(months)}
                aria-pressed={localTrendMonths === months}
                className={`${styles.rangeButton} ${localTrendMonths === months ? styles.rangeButtonActive : ""}`}
              >
                {months} bln
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.seriesLegend} mt-4`} aria-label="Seri grafik">
            {(["income", "expense"] as const).map((key) => {
              const color = key === "income" ? "var(--lk-income)" : "var(--lk-expense)";
              return <button key={key} type="button" aria-pressed={visibleLines[key]}
                className={`${styles.legendButton} ${visibleLines[key] ? styles.legendButtonActive : ""}`}
                style={{ "--series-color": color } as React.CSSProperties}
                onClick={() => setVisibleLines((current) => ({ ...current, [key]: !current[key] }))}>
                <span className={styles.legendLine} aria-hidden="true" />
                {key === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>;
            })}
        </div>

        {!trendData.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Belum ada data trend.</p>
        ) : !mounted ? (
          <div className="mt-4 h-[240px] w-full bg-slate-100/50 dark:bg-slate-900/20 rounded-xl animate-pulse" />
        ) : (
          <div className="relative mt-4 h-[240px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <LineChart
                key={localTrendMonths}
                data={convertedTrendData}
                accessibilityLayer
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
                {visibleLines.income ? (
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Pemasukan"
                    stroke="#10b981"
                    strokeWidth={2.6}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--surface)" }}
                    animationDuration={850}
                    animationBegin={60}
                    animationEasing="ease-out"
                    isAnimationActive={!isAndroid && !reducedMotion}
                  />
                ) : null}
                {visibleLines.expense ? (
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Pengeluaran"
                    stroke="#ef4444"
                    strokeWidth={2.6}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--surface)" }}
                    animationDuration={850}
                    animationBegin={60}
                    animationEasing="ease-out"
                    isAnimationActive={!isAndroid && !reducedMotion}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>



      <article className="section-card min-w-0 max-w-full overflow-hidden lg:col-span-7">
        <h2 className="text-lg font-semibold">Tren Arus Kas</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Nilai positif berarti pemasukan lebih besar dari pengeluaran.
        </p>

        {!convertedTrendData.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Belum ada data arus kas.</p>
        ) : !mounted ? (
          <div className="mt-4 h-[240px] w-full bg-slate-100/50 dark:bg-slate-900/20 rounded-xl animate-pulse" />
        ) : (
          <div className="mt-4 h-[240px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={convertedTrendData} accessibilityLayer>
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
                <Bar dataKey="cashflow" radius={[8, 8, 0, 0]} isAnimationActive={!isAndroid && !reducedMotion}>
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
        <h2 className="text-lg font-semibold">Estimasi per Kategori</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Estimasi pengeluaran per kategori bulan berikutnya.
        </p>

        {!forecastBars.length ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Estimasi kategori belum tersedia.
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
              {!mounted ? (
                <div className="h-full w-full bg-slate-100/50 dark:bg-slate-900/20 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <BarChart
                    layout="vertical"
                    data={forecastBars}
                    accessibilityLayer
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
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#0ea5a5" isAnimationActive={!isAndroid && !reducedMotion} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </article>
    </>
  );
}

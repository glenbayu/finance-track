"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { convertFromIDR, formatCurrency } from "@/lib/utils/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useEffect, useState } from "react";

type MonthlyExpenseTrendItem = {
  month: string;
  expense: number;
};

type MonthlyExpenseTrendProps = {
  data: MonthlyExpenseTrendItem[];
};

type ExpenseTrendTooltipEntry = {
  value?: number | string | null;
};

type ExpenseTrendTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ExpenseTrendTooltipEntry[];
  currency: ReturnType<typeof useDisplayCurrency>["effectiveCurrency"];
};

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function ExpenseTrendTooltip({
  active,
  payload,
  label,
  currency,
}: ExpenseTrendTooltipProps) {
  if (!active || !payload?.length) return null;

  const amount = Number(payload[0]?.value ?? 0);
  const isAndroid = typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div
      className={`rounded-xl border border-slate-200/50 px-3 py-2 shadow-md ${
        isAndroid
          ? "bg-white dark:bg-[#0a0a0a]"
          : "bg-white/80 backdrop-blur-md dark:bg-[#0a0a0a]/80"
      } dark:border-slate-800/60`}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {String(label ?? "")}
      </p>
      <p className="mt-0.5 text-sm font-medium font-mono text-teal-700 dark:text-teal-400">
        {formatCurrency(amount, currency)}
      </p>
    </div>
  );
}

export default function MonthlyExpenseTrend({
  data,
}: MonthlyExpenseTrendProps) {
  const { effectiveCurrency, rateFromIDR } = useDisplayCurrency();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const chartData = data.map((item) => ({
    ...item,
    expenseConverted: convertFromIDR(item.expense, effectiveCurrency, rateFromIDR),
    label: formatMonthLabel(item.month),
  }));

  // Deep Teal for AreaChart
  const strokeColor = isDark ? "#2dd4bf" : "#0f766e";

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-6 pl-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Trend Pengeluaran Bulanan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Perbandingan total pengeluaran beberapa bulan terakhir</p>
      </div>

      <div className="relative min-h-[220px] w-full flex-1">
        {!mounted ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-full rounded-md bg-slate-100/50 animate-pulse dark:bg-slate-800/30" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDark ? "#64748b" : "#94a3b8" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDark ? "#64748b" : "#94a3b8" }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)} jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                  return val;
                }}
              />
              <Tooltip
                content={<ExpenseTrendTooltip currency={effectiveCurrency} />}
                cursor={{ stroke: isDark ? "#334155" : "#e2e8f0", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="expenseConverted"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
                animationDuration={1000}
                activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

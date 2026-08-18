"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMaskedAmounts } from "@/components/ui/masked-amount";
import InteractiveDotPanel from "@/components/ui/interactive-dot-panel";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useEffect, useState, useMemo } from "react";
type ExpenseChartItem = {
  name: string;
  value: number;
};

type ExpenseChartProps = {
  data: ExpenseChartItem[];
};

// Strict Monochrome / Teal Palette
const COLORS_LIGHT = ["#0f766e", "#0d9488", "#14b8a6", "#5eead4", "#94a3b8", "#cbd5e1"];
const COLORS_DARK = ["#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#475569", "#334155"];

const MAX_CATEGORIES = 6;

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const masked = useMaskedAmounts();
  const isHidden = masked?.isHidden ?? false;
  const { formatFromIDR } = useDisplayCurrency();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAndroid = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gates client-only chart rendering after hydration.
    setMounted(true);
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

  // Limit to max 6 categories
  const limitedData = useMemo(() => data.slice(0, MAX_CATEGORIES), [data]);
  const totalExpense = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const breakdown = useMemo(() => limitedData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    percentage: totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0,
  })), [limitedData, COLORS, totalExpense]);
  const topCategory = breakdown[0];

  if (!data.length) {
    return (
      <InteractiveDotPanel className="section-card">
        <h2 className="text-xl font-semibold">Pengeluaran per Kategori</h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Belum ada data pengeluaran.</p>
      </InteractiveDotPanel>
    );
  }

  return (
    <InteractiveDotPanel className="section-card overflow-hidden">
      <h2 className="text-xl font-semibold">Pengeluaran per Kategori</h2>

      {/* ── MOBILE layout: chart on top, total below chart, then list ── */}
      <div className="mt-4 flex flex-col sm:hidden">
        {/* Donut chart – no centre label on mobile, label is rendered below */}
        <div className="relative mx-auto w-[180px]">
          {!mounted ? (
            <div className="h-[180px] w-[180px] rounded-full bg-slate-100/50 animate-pulse dark:bg-slate-900/20" />
          ) : (
            <ResponsiveContainer width="100%" aspect={1} minHeight={160}>
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={limitedData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="82%"
                  innerRadius="56%"
                  paddingAngle={2}
                  labelLine={false}
                  animationDuration={isAndroid ? 0 : 550}
                >
                  {limitedData.map((_, index) => (
                    <Cell
                      key={`cell-mobile-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;

                    const point = payload[0]?.payload as ExpenseChartItem | undefined;
                    if (!point) return null;

                    const percentage =
                      totalExpense > 0
                        ? Math.round((point.value / totalExpense) * 100)
                        : 0;

                    return (
                      <div
                        className={`rounded-xl border border-slate-200/50 px-3 py-2 shadow-md ${isAndroid
                          ? "bg-white dark:bg-[#0a0c10]"
                          : "bg-white/75 backdrop-blur-md dark:bg-[#0a0c10]/75"
                          } dark:border-white/5`}
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{point.name}</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{isHidden ? "******" : formatFromIDR(point.value)}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {percentage}% dari total
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Total expense label – below chart on mobile */}
        <div className="mt-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Pengeluaran</p>
          <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">
            {isHidden ? "******" : formatFromIDR(totalExpense)}
          </p>
        </div>

        {/* Category breakdown list – scrollable, max 6 */}
        <div className="mt-4 max-h-[340px] space-y-2 overflow-y-auto sm:hidden scroll-optimized pr-0.5">
          {breakdown.map((item) => (
            <div key={item.name} className="soft-inset p-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isHidden ? "***" : formatFromIDR(item.value)}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {item.percentage}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {topCategory ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Kategori terbesar bulan ini:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {topCategory.name} ({topCategory.percentage}%)
            </span>
          </p>
        ) : null}
      </div>

      {/* ── DESKTOP layout: chart left, list right (original) ── */}
      <div className="mt-4 hidden sm:flex items-start gap-5">
        <div className="shrink-0 w-[180px]">
          <div className="relative mx-auto w-full">
            {!mounted ? (
              /* Stable GPU placeholder to prevent layout shifts */
              <div className="mx-auto h-[190px] w-[190px] rounded-full bg-slate-100/50 animate-pulse dark:bg-slate-900/20 sm:h-[220px] sm:w-[220px]" />
            ) : (
              <>
                <ResponsiveContainer width="100%" aspect={1} minHeight={160}>
                  <PieChart accessibilityLayer={false}>
                    <Pie
                      data={limitedData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius="82%"
                      innerRadius="56%"
                      paddingAngle={2}
                      labelLine={false}
                      animationDuration={isAndroid ? 0 : 550}
                    >
                      {limitedData.map((_, index) => (
                        <Cell
                          key={`cell-desktop-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;

                        const point = payload[0]?.payload as ExpenseChartItem | undefined;
                        if (!point) return null;

                        const percentage =
                          totalExpense > 0
                            ? Math.round((point.value / totalExpense) * 100)
                            : 0;

                        return (
                          <div
                            className={`rounded-xl border border-slate-200/50 px-3 py-2 shadow-md ${isAndroid
                              ? "bg-white dark:bg-[#0a0c10]"
                              : "bg-white/75 backdrop-blur-md dark:bg-[#0a0c10]/75"
                              } dark:border-white/5`}
                          >
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{point.name}</p>
                            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{isHidden ? "******" : formatFromIDR(point.value)}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {percentage}% dari total
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centre label – only on desktop */}
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <div className="text-center leading-tight px-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {isHidden ? "***" : formatFromIDR(totalExpense)}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                      Total
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Legend / Breakdown - fills remaining space, max 6 with scroll */}
        <div className="flex-1 min-w-0">
          <div className="w-full space-y-2 max-h-[460px] overflow-y-auto pr-0.5 scroll-optimized">
            {breakdown.map((item) => (
              <div key={item.name} className="soft-inset p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {isHidden ? "***" : formatFromIDR(item.value)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {item.percentage}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {topCategory ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Kategori terbesar bulan ini:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {topCategory.name} ({topCategory.percentage}%)
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </InteractiveDotPanel>
  );
}

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

type ExpenseChartItem = {
  name: string;
  value: number;
};

type ExpenseChartProps = {
  data: ExpenseChartItem[];
};

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const masked = useMaskedAmounts();
  const isHidden = masked?.isHidden ?? false;
  const { formatFromIDR } = useDisplayCurrency();

  const totalExpense = data.reduce((sum, item) => sum + item.value, 0);
  const breakdown = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    percentage: totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0,
  }));
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

      <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(230px,280px)] lg:items-start">
        <div className="w-full min-w-0">
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-none lg:max-w-[380px]">
            <ResponsiveContainer width="100%" aspect={1.05} minHeight={220}>
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="79%"
                  innerRadius="51%"
                  paddingAngle={2}
                  labelLine={false}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
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
                        className="rounded-xl border px-3 py-2 shadow-sm"
                        style={{
                          borderColor: "var(--stroke)",
                          backgroundColor: "var(--surface)",
                          color: "var(--foreground)",
                        }}
                      >
                        <p className="text-sm font-semibold">{point.name}</p>
                        <p className="text-sm">{isHidden ? "***" : formatFromIDR(point.value)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {percentage}% dari total
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center lg:hidden">
              <div className="text-center leading-tight">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
                  {isHidden ? "***" : formatFromIDR(totalExpense)}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  Total Pengeluaran
                </p>
              </div>
            </div>
          </div>

          <div className="mt-0 hidden text-center lg:-mt-20 lg:block">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              Total Pengeluaran
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
              {isHidden ? "***" : formatFromIDR(totalExpense)}
            </p>
          </div>
        </div>

        <div>
          <div className="scroll-optimized h-[320px] space-y-2 overflow-y-auto pr-1 md:h-[520px] lg:h-[390px]">
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

"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { convertFromIDR, formatCurrency } from "@/lib/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

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

  return (
    <div
      className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--surface)] px-3 py-2 shadow-lg"
      style={{ color: "var(--foreground)" }}
    >
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {String(label ?? "")}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {formatCurrency(amount, currency)}
      </p>
    </div>
  );
}

export default function MonthlyExpenseTrend({
  data,
}: MonthlyExpenseTrendProps) {
  const { effectiveCurrency, rateFromIDR } = useDisplayCurrency();

  const chartData = data.map((item) => ({
    ...item,
    expenseConverted: convertFromIDR(item.expense, effectiveCurrency, rateFromIDR),
    label: formatMonthLabel(item.month),
  }));

  return (
    <div className="section-card">
      <div className="mb-3">
        <h2 className="text-xl font-semibold">Trend Pengeluaran Bulanan</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Perbandingan total pengeluaran beberapa bulan terakhir
        </p>
      </div>

      {!chartData.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada data pengeluaran.</p>
      ) : (
        <div className="h-[250px] w-full md:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} accessibilityLayer={false}>
              <CartesianGrid stroke="var(--stroke)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "var(--foreground)" }}
              />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("id-ID", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "var(--foreground)" }}
              />
              <Tooltip
                content={<ExpenseTrendTooltip currency={effectiveCurrency} />}
                cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
              />
              <Bar
                dataKey="expenseConverted"
                fill="#2563eb"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

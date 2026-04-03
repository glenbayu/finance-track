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

type MonthlyExpenseTrendItem = {
  month: string;
  expense: number;
};

type MonthlyExpenseTrendProps = {
  data: MonthlyExpenseTrendItem[];
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export default function MonthlyExpenseTrend({
  data,
}: MonthlyExpenseTrendProps) {
  const chartData = data.map((item) => ({
    ...item,
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
            <BarChart data={chartData}>
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
                formatter={(value) => formatRupiah(Number(value ?? 0))}
                labelFormatter={(label) => `Bulan: ${label}`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--stroke)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
              />
              <Bar
                dataKey="expense"
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

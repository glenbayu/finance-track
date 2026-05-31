"use client";

import { useDisplayCurrency } from "@/hooks/use-display-currency";

type MonthlyHistoryItem = {
  month: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyHistoryProps = {
  data: MonthlyHistoryItem[];
};

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function MonthlyHistory({ data }: MonthlyHistoryProps) {
  const { formatFromIDR } = useDisplayCurrency();

  return (
    <div className="section-card">
      <div className="mb-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Riwayat Bulanan</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">Beberapa bulan terakhir</span>
      </div>

      {!data.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada riwayat transaksi.</p>
      ) : (
        <div className="scroll-optimized min-h-0 max-h-[420px] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-16rem)]">
          {data.map((item) => (
            <div
              key={item.month}
              className="soft-inset"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMonthLabel(item.month)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ringkasan pemasukan dan pengeluaran
                  </p>
                </div>

                <div className="grid w-full gap-3 text-sm [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Pemasukan</p>
                    <p className="font-semibold text-emerald-600">
                      {formatFromIDR(item.income)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Pengeluaran</p>
                    <p className="font-semibold text-rose-600">
                      {formatFromIDR(item.expense)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Selisih</p>
                    <p
                      className={`font-semibold ${
                        item.balance >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatFromIDR(item.balance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

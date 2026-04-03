import { ChevronDown } from "lucide-react";

type TopSpendingTransaction = {
  id: string;
  amount: number;
  note: string | null;
  transaction_date: string | null;
};

type TopSpendingItem = {
  category_name: string;
  amount: number;
  previous_amount: number;
  change_pct: number | null;
  transaction_count: number;
  transactions: TopSpendingTransaction[];
};

type TopSpendingInsightProps = {
  data: TopSpendingItem[];
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Tanggal tidak tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatChangeText(currentAmount: number, previousAmount: number, changePct: number | null) {
  if (previousAmount <= 0 && currentAmount > 0) {
    return {
      text: "Baru bulan ini",
      className: "text-slate-500 dark:text-slate-400",
    };
  }

  if (previousAmount <= 0) {
    return {
      text: "0% vs bulan lalu",
      className: "text-slate-500 dark:text-slate-400",
    };
  }

  const rounded = Math.round(changePct ?? 0);
  if (rounded === 0) {
    return {
      text: "0% vs bulan lalu",
      className: "text-slate-500 dark:text-slate-400",
    };
  }

  const sign = rounded > 0 ? "+" : "";
  return {
    text: `${sign}${rounded}% vs bulan lalu`,
    className: rounded > 0 ? "text-rose-600" : "text-emerald-600",
  };
}

export default function TopSpendingInsight({ data }: TopSpendingInsightProps) {
  return (
    <div className="section-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Top Kategori Pengeluaran Bulan Ini</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Akumulasi pengeluaran per kategori di bulan yang sedang dipilih
          </p>
        </div>
      </div>

      {!data.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Belum ada kategori pengeluaran di bulan ini.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => (
            <details key={`${item.category_name}-${index}`} className="soft-inset group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <span className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-600">
                    {index + 1}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                      {item.category_name}
                    </span>
                    <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
                      {item.transaction_count} transaksi - klik untuk lihat detail
                    </span>
                  </span>
                </span>

                <span className="ml-4 flex shrink-0 items-center gap-2">
                  <span className="flex flex-col items-end leading-tight">
                    <span className="font-semibold text-red-600">{formatRupiah(item.amount)}</span>
                    {(() => {
                      const change = formatChangeText(
                        item.amount,
                        item.previous_amount,
                        item.change_pct,
                      );
                      return (
                        <span className={`text-xs font-semibold ${change.className}`}>
                          {change.text}
                        </span>
                      );
                    })()}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 transition group-open:rotate-180"
                  />
                </span>
              </summary>

              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                {item.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                        {transaction.note || "Tanpa catatan"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(transaction.transaction_date)}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-rose-600">
                      {formatRupiah(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

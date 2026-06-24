"use client";

import { ChevronDown } from "lucide-react";
import { useMaskedAmounts } from "@/components/ui/masked-amount";
import InteractiveDotPanel from "@/components/ui/interactive-dot-panel";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

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
  totalExpense: number;
};

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

function formatContribution(percentage: number) {
  if (!Number.isFinite(percentage)) return "0%";
  if (percentage >= 10) return `${Math.round(percentage)}%`;
  return `${percentage.toFixed(1)}%`;
}

export default function TopSpendingInsight({
  data,
  totalExpense,
}: TopSpendingInsightProps) {
  const masked = useMaskedAmounts();
  const isHidden = masked?.isHidden ?? false;
  const { formatFromIDR } = useDisplayCurrency();
  const panelClassName = data.length
    ? "section-card flex min-h-[30rem] flex-col md:min-h-[34rem] lg:min-h-0"
    : "section-card";

  return (
    <InteractiveDotPanel className={panelClassName}>
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
        <div className="scroll-optimized min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-18rem)]">
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
                      {item.transaction_count} transaksi
                    </span>
                  </span>
                </span>

                <span className="ml-4 flex shrink-0 items-center gap-2">
                  <span className="flex flex-col items-end leading-tight">
                    <span className="font-semibold text-red-600">
                      {isHidden ? "***" : formatFromIDR(item.amount)}
                    </span>
                    {isHidden ? (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Kontribusi{" "}
                        {formatContribution(totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0)}
                      </span>
                    ) : (
                      <ChangeBadge
                        amount={item.amount}
                        previousAmount={item.previous_amount}
                        changePct={item.change_pct}
                      />
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 transition group-open:rotate-180"
                  />
                </span>
              </summary>

              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, (item.amount / Math.max(totalExpense, 1)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Kontribusi kategori ini:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatContribution(totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0)}
                  </span>
                </p>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="scroll-optimized min-h-0 max-h-72 space-y-2 overflow-y-auto pr-1 md:max-h-80 lg:max-h-[22rem]">
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
                        {isHidden ? "***" : formatFromIDR(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </InteractiveDotPanel>
  );
}

function ChangeBadge({ amount, previousAmount, changePct }: {
  amount: number;
  previousAmount: number;
  changePct: number | null
}) {
  const change = formatChangeText(
    amount,
    previousAmount,
    changePct,
  );
  return (
    <span className={`text-xs font-semibold ${change.className}`}>
      {change.text}
    </span>
  );
}

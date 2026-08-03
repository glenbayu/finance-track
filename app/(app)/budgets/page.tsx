import Link from "next/link";
import { revalidatePath } from "next/cache";
import BudgetAmountInput from "@/components/budgets/budget-amount-input";
import AppShell from "@/components/layout/app-shell";
import SubmitButton from "@/components/ui/submit-button";
import MonthFilter from "@/components/ui/month-filter";
import CurrencyAmount from "@/components/ui/currency-amount";
import { getCurrentMonth, getMonthRange, isMonthValue } from "@/lib/utils/date";
import { formatDate } from "@/lib/utils/format";
import { requireUser } from "@/lib/supabase/auth";

type BudgetsPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

type BudgetRow = {
  id: string;
  category_id: string;
  month: string;
  amount: number;
};

type ExpenseCategory = {
  id: string;
  name: string;
  type: "expense";
  user_id: string | null;
  archived_at: string | null;
};

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function progressTone(percentage: number) {
  if (percentage >= 100) return "danger";
  if (percentage >= 70) return "warn";
  return "safe";
}

function sanitizeMonth(value: FormDataEntryValue | null) {
  const month = String(value || "");
  if (!MONTH_REGEX.test(month)) {
    throw new Error("Format bulan tidak valid. Gunakan YYYY-MM.");
  }
  return month;
}

async function upsertBudget(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();
  const categoryId = String(formData.get("category_id") || "");
  const month = sanitizeMonth(formData.get("month"));
  const amount = Number(formData.get("amount"));

  if (!categoryId) {
    throw new Error("Kategori wajib dipilih.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal budget harus lebih dari 0.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", categoryId)
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .is("archived_at", null)
    .single();

  if (categoryError || !category || category.type !== "expense") {
    throw new Error("Kategori budget tidak valid.");
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      month,
      amount,
    },
    {
      onConflict: "user_id,category_id,month",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/budgets");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/transactions");
}

async function deleteBudget(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();
  const budgetId = String(formData.get("budget_id") || "");

  if (!budgetId) {
    throw new Error("Budget tidak valid.");
  }

  const { data: budget, error: readError } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .single();

  if (readError || !budget) {
    throw new Error("Budget tidak ditemukan.");
  }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/budgets");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/transactions");
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const selectedMonth = isMonthValue(params?.month ?? "") ? (params?.month as string) : getCurrentMonth();
  const { start, end } = getMonthRange(selectedMonth);

  const [categoriesResult, budgetsResult, expensesResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, type, user_id, archived_at")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq("type", "expense")
      .order("name", { ascending: true }),
    supabase
      .from("budgets")
      .select("id, category_id, month, amount")
      .eq("user_id", user.id)
      .eq("month", selectedMonth),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("transaction_date", start)
      .lt("transaction_date", end),
  ]);

  if (categoriesResult.error) {
    throw new Error(`Gagal memuat kategori: ${categoriesResult.error.message}`);
  }
  if (budgetsResult.error) {
    throw new Error(`Gagal memuat budgets: ${budgetsResult.error.message}`);
  }
  if (expensesResult.error) {
    throw new Error(`Gagal memuat pengeluaran: ${expensesResult.error.message}`);
  }

  const categories = (categoriesResult.data ?? []) as ExpenseCategory[];
  const activeCategories = categories.filter((item) => !item.archived_at);
  const budgets = (budgetsResult.data ?? []) as BudgetRow[];
  const expenses = expensesResult.data ?? [];

  const budgetByCategory = new Map<string, BudgetRow>();
  budgets.forEach((item) => {
    budgetByCategory.set(item.category_id, item);
  });

  const spentByCategory = new Map<string, number>();
  expenses.forEach((row) => {
    const categoryId = row.category_id ?? "";
    if (!categoryId) return;
    spentByCategory.set(categoryId, (spentByCategory.get(categoryId) ?? 0) + Number(row.amount));
  });

  const budgetCards = activeCategories.map((category) => {
    const budget = budgetByCategory.get(category.id);
    const budgetAmount = Number(budget?.amount ?? 0);
    const spentAmount = spentByCategory.get(category.id) ?? 0;
    const remaining = budgetAmount - spentAmount;
    const usedPct = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    return {
      category,
      budget,
      budgetAmount,
      spentAmount,
      remaining,
      usedPct,
    };
  });

  const archivedBudgetCards = budgets
    .filter((budget) => !activeCategories.some((category) => category.id === budget.category_id))
    .map((budget) => {
      const archivedCategory = categories.find((category) => category.id === budget.category_id);
      const spentAmount = spentByCategory.get(budget.category_id) ?? 0;
      const budgetAmount = Number(budget.amount ?? 0);
      const remaining = budgetAmount - spentAmount;
      const usedPct = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      return {
        categoryName: archivedCategory?.name ?? "Kategori tidak ditemukan",
        archivedAt: archivedCategory?.archived_at ?? null,
        budgetAmount,
        spentAmount,
        remaining,
        usedPct,
      };
    });

  const totalBudget = budgetCards.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalSpent = budgetCards.reduce((sum, item) => sum + item.spentAmount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const categoriesOverBudget = budgetCards.filter((item) => item.budgetAmount > 0 && item.spentAmount > item.budgetAmount).length;
  const hasAnyBudget = budgets.length > 0;

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="budgets"
      month={selectedMonth}
      title="Budgets"
      description="Atur limit pengeluaran per kategori agar cashflow tetap sehat."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <>
          <MonthFilter selectedMonth={selectedMonth} className="min-w-[210px]" />
        </>
      }
      mobileActions={<MonthFilter selectedMonth={selectedMonth} className="w-full" />}
    >
      {!activeCategories.length ? (
        <section className="section-card">
          <h2 className="text-xl font-semibold">Belum ada kategori pengeluaran</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Buat kategori pengeluaran dulu agar kamu bisa memasang budget per kategori.
          </p>
          <div className="mt-5">
            <Link href="/categories" className="btn-primary">
              Buka Halaman Kategori
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="stat-card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Budget</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <CurrencyAmount amountIDR={totalBudget} />
              </p>
            </article>
            <article className="stat-card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Spent</p>
              <p className="mt-2 text-xl font-semibold text-rose-600">
                <CurrencyAmount amountIDR={totalSpent} />
              </p>
            </article>
            <article className="stat-card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Remaining</p>
              <p className={`mt-2 text-xl font-semibold ${remainingBudget >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                <CurrencyAmount amountIDR={remainingBudget} />
              </p>
            </article>
            <article className="stat-card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Over Budget</p>
              <p className={`mt-2 text-xl font-semibold ${categoriesOverBudget > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {categoriesOverBudget} kategori
              </p>
            </article>
          </section>

          {!hasAnyBudget ? (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Belum ada budget tersimpan</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Isi nominal budget pada kategori di bawah, lalu klik Simpan. Sistem akan membandingkan realisasi pengeluaranmu secara otomatis.
              </p>
            </section>
          ) : (
            <section className="mt-6">
              <div className="mb-3 px-4">
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Daftar Anggaran</h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 dark:border-slate-800 dark:bg-slate-900">
                {budgetCards.map((item) => {
                  const tone = progressTone(item.usedPct);
                  const clampedPct = Math.min(100, Math.max(0, item.usedPct));
                  const isDanger = tone === "danger";

                  return (
                    <details
                      key={item.category.id}
                      className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isDanger ? "bg-rose-50/30 dark:bg-rose-950/10" : ""}`}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between p-4 outline-none [&::-webkit-details-marker]:hidden">
                        <div className="flex w-full items-center justify-between gap-3 pr-4">
                          <div className="min-w-0 flex-1">
                            <h3 className={`truncate text-[15px] font-medium ${isDanger ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                              {item.category.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.budgetAmount > 0 ? (
                                <CurrencyAmount amountIDR={item.spentAmount} />
                              ) : (
                                "Belum diset"
                              )}
                              {item.budgetAmount > 0 && " terpakai"}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {item.budgetAmount > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className={`text-[13px] font-bold ${isDanger ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}>
                                  {Math.round(item.usedPct)}%
                                </span>
                                <div className="w-16 h-1.5 mt-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isDanger ? "bg-rose-500 animate-pulse" : tone === "warn" ? "bg-amber-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${clampedPct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
                                -
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-slate-300 transition-transform group-open:rotate-90 dark:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                      </summary>

                      {/* Expanded Content */}
                      <div className={`mx-4 mb-4 mt-1 rounded-xl border-t px-4 pb-4 pt-3 ${isDanger ? "border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20" : "border-slate-100 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50"}`}>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4 bg-white dark:bg-slate-900/80 rounded-lg py-2 shadow-sm border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Budget</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                              {item.budgetAmount > 0 ? <CurrencyAmount amountIDR={item.budgetAmount} /> : "-"}
                            </p>
                          </div>
                          <div className="border-x border-slate-100 dark:border-slate-800/50">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Terpakai</p>
                            <p className="font-semibold text-rose-600">
                              <CurrencyAmount amountIDR={item.spentAmount} />
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Sisa</p>
                            <p className={`font-semibold ${item.remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              <CurrencyAmount amountIDR={item.remaining} />
                            </p>
                          </div>
                        </div>

                        <form action={upsertBudget} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <div>
                            <input type="hidden" name="category_id" value={item.category.id} />
                            <input type="hidden" name="month" value={selectedMonth} />
                            <BudgetAmountInput
                              defaultValue={item.budgetAmount}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Nominal budget"
                            />
                          </div>
                          <div className="flex gap-2">
                            <SubmitButton className="btn-primary h-11 px-5 rounded-xl font-semibold" pendingText="...">
                              {item.budget ? "Update" : "Simpan"}
                            </SubmitButton>
                            
                            {item.budget && (
                              <button 
                                formAction={deleteBudget} 
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-100 px-4 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          )}

          {archivedBudgetCards.length ? (
            <section className="mt-6">
              <div className="mb-3 px-4">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Anggaran Kategori Arsip</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Data lama tetap ditampilkan agar riwayat pengeluaran tetap terbaca.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 dark:border-slate-800 dark:bg-slate-900/30">
                {archivedBudgetCards.map((item, index) => (
                  <div key={`${item.categoryName}-${index}`} className="flex flex-col gap-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[15px] text-slate-700 dark:text-slate-300">
                        {item.categoryName}
                      </p>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Arsip
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {item.archivedAt ? `Diarsipkan: ${formatDate(item.archivedAt)}` : "Kategori sudah tidak aktif"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-4 rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:border-slate-800/50 dark:bg-slate-900">
                      <div>
                        <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Budget</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {item.budgetAmount > 0 ? <CurrencyAmount amountIDR={item.budgetAmount} /> : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Terpakai</span>
                        <span className="font-semibold text-rose-500 dark:text-rose-400">
                          <CurrencyAmount amountIDR={item.spentAmount} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

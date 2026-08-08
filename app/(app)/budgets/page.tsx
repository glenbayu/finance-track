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
      eyebrow="Rencana Pengeluaran"
      title="Anggaran"
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
              <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Total Anggaran</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: "var(--lk-text)" }}>
                <CurrencyAmount amountIDR={totalBudget} />
              </p>
            </article>
            <article className="stat-card">
              <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Total Terpakai</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: "var(--lk-expense)" }}>
                <CurrencyAmount amountIDR={totalSpent} />
              </p>
            </article>
            <article className="stat-card">
              <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Sisa Anggaran</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: remainingBudget >= 0 ? "var(--lk-income)" : "var(--lk-expense)" }}>
                <CurrencyAmount amountIDR={remainingBudget} />
              </p>
            </article>
            <article className="stat-card">
              <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>Melewati Batas</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: categoriesOverBudget > 0 ? "var(--lk-expense)" : "var(--lk-income)" }}>
                {categoriesOverBudget} kategori
              </p>
            </article>
          </section>

          {!hasAnyBudget ? (
            <section className="mt-6 rounded-md p-6" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--lk-text)" }}>Belum ada budget tersimpan</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--lk-text-muted)" }}>
                Isi nominal budget pada kategori di bawah, lalu klik Simpan. Sistem akan membandingkan realisasi pengeluaranmu secara otomatis.
              </p>
            </section>
          ) : (
            <section className="mt-6">
              <div className="mb-3 px-4">
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--lk-text)" }}>Daftar Anggaran</h2>
              </div>
              <div className="overflow-hidden rounded-md" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
                {budgetCards.map((item) => {
                  const tone = progressTone(item.usedPct);
                  const clampedPct = Math.min(100, Math.max(0, item.usedPct));
                  const isDanger = tone === "danger";

                  return (
                    <details
                      key={item.category.id}
                      className="group hover-bg-surface-hover transition-colors"
                      style={{ borderBottom: "1px solid var(--lk-border)", backgroundColor: isDanger ? "var(--lk-expense-dim)" : "transparent" }}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between p-4 outline-none [&::-webkit-details-marker]:hidden">
                        <div className="flex w-full items-center justify-between gap-3 pr-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[15px] font-medium" style={{ color: isDanger ? "var(--lk-expense)" : "var(--lk-text)" }}>
                              {item.category.name}
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: "var(--lk-text-muted)" }}>
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
                                <span className="text-[13px] font-bold" style={{ color: isDanger ? "var(--lk-expense)" : "var(--lk-text)" }}>
                                  {Math.round(item.usedPct)}%
                                </span>
                                <div className="w-16 h-1.5 mt-1 overflow-hidden rounded-full" style={{ backgroundColor: "var(--lk-border)" }}>
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isDanger ? "animate-pulse" : ""}`}
                                    style={{ width: `${clampedPct}%`, backgroundColor: isDanger ? "var(--lk-expense)" : tone === "warn" ? "#f59e0b" : "var(--lk-income)" }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[13px] font-medium" style={{ color: "var(--lk-text-muted)" }}>
                                -
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="transition-transform group-open:rotate-90" style={{ color: "var(--lk-text-muted)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                      </summary>

                      {/* Expanded Content */}
                      <div className="mx-4 mb-4 mt-1 rounded-lg px-4 pb-4 pt-3" style={{ backgroundColor: isDanger ? "var(--lk-expense-dim)" : "var(--lk-bg)", borderTop: "1px solid var(--lk-border)" }}>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4 rounded-md py-2" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border)" }}>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--lk-text-muted)" }}>Anggaran</p>
                            <p className="font-semibold" style={{ color: "var(--lk-text)" }}>
                              {item.budgetAmount > 0 ? <CurrencyAmount amountIDR={item.budgetAmount} /> : "-"}
                            </p>
                          </div>
                          <div style={{ borderLeft: "1px solid var(--lk-border)", borderRight: "1px solid var(--lk-border)" }}>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--lk-text-muted)" }}>Terpakai</p>
                            <p className="font-semibold" style={{ color: "var(--lk-expense)" }}>
                              <CurrencyAmount amountIDR={item.spentAmount} />
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--lk-text-muted)" }}>Sisa</p>
                            <p className="font-semibold" style={{ color: item.remaining >= 0 ? "var(--lk-income)" : "var(--lk-expense)" }}>
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
                              className="input-base w-full px-4 py-2.5 text-[15px]"
                              placeholder="Nominal budget"
                            />
                          </div>
                          <div className="flex gap-2">
                            <SubmitButton className="btn-primary h-11 px-5 rounded-md font-semibold" pendingText="...">
                              {item.budget ? "Update" : "Simpan"}
                            </SubmitButton>
                            
                            {item.budget && (
                              <button 
                                formAction={deleteBudget} 
                                className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors hover:opacity-80"
                                style={{ backgroundColor: "var(--lk-expense-dim)", color: "var(--lk-expense)" }}
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
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--lk-text)" }}>Anggaran Kategori Arsip</h3>
                <p className="mt-0.5 text-xs" style={{ color: "var(--lk-text-muted)" }}>
                  Data lama tetap ditampilkan agar riwayat pengeluaran tetap terbaca.
                </p>
              </div>
              <div className="overflow-hidden rounded-lg shadow-sm" style={{ backgroundColor: "var(--lk-bg)", border: "1px solid var(--lk-border-strong)" }}>
                {archivedBudgetCards.map((item, index) => (
                  <div key={`${item.categoryName}-${index}`} className="flex flex-col gap-2 p-4 hover-bg-surface-hover" style={{ borderBottom: "1px solid var(--lk-border)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[15px]" style={{ color: "var(--lk-text)" }}>
                        {item.categoryName}
                      </p>
                      <span className="chip-default">
                        Arsip
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--lk-text-muted)" }}>
                      {item.archivedAt ? `Diarsipkan: ${formatDate(item.archivedAt)}` : "Kategori sudah tidak aktif"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg p-3 shadow-sm" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border)" }}>
                      <div>
                        <span className="block text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--lk-text-muted)" }}>Budget</span>
                        <span className="font-semibold" style={{ color: "var(--lk-text)" }}>
                          {item.budgetAmount > 0 ? <CurrencyAmount amountIDR={item.budgetAmount} /> : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--lk-text-muted)" }}>Terpakai</span>
                        <span className="font-semibold" style={{ color: "var(--lk-expense)" }}>
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

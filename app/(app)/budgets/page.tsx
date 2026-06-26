import Link from "next/link";
import { revalidatePath } from "next/cache";
import BudgetAmountInput from "@/components/budgets/budget-amount-input";
import AppShell from "@/components/layout/app-shell";
import SubmitButton from "@/components/ui/submit-button";
import MonthFilter from "@/components/ui/month-filter";
import CurrencyAmount from "@/components/ui/currency-amount";
import { getCurrentMonth, getMonthRange, isMonthValue } from "@/lib/date";
import { formatDate } from "@/lib/format";
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
            <section className="section-card mt-6">
              <h3 className="text-lg font-semibold">Belum ada budget tersimpan</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Isi nominal budget pada kategori di bawah, lalu klik Simpan. Sistem akan bandingkan realisasi pengeluaranmu secara otomatis.
              </p>
            </section>
          ) : null}

          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            {budgetCards.map((item) => {
              const tone = progressTone(item.usedPct);
              const clampedPct = Math.min(100, Math.max(0, item.usedPct));
              return (
                <article key={item.category.id} className="section-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">{item.category.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Budget bulan {selectedMonth}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        tone === "danger"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/35 dark:text-rose-300"
                          : tone === "warn"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300"
                      }`}
                    >
                      {item.budgetAmount > 0 ? `${Math.round(item.usedPct)}% terpakai` : "Belum set budget"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Budget</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.budgetAmount > 0 ? <CurrencyAmount amountIDR={item.budgetAmount} /> : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Terpakai</span>
                      <span className="font-semibold text-rose-600">
                        <CurrencyAmount amountIDR={item.spentAmount} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Sisa</span>
                      <span className={`font-semibold ${item.remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        <CurrencyAmount amountIDR={item.remaining} />
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        tone === "danger" ? "bg-rose-500" : tone === "warn" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${clampedPct}%` }}
                    />
                  </div>

                  <form action={upsertBudget} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <input type="hidden" name="category_id" value={item.category.id} />
                      <input type="hidden" name="month" value={selectedMonth} />
                      <BudgetAmountInput
                        defaultValue={item.budgetAmount}
                        className="input-base"
                        placeholder="Nominal budget"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Nominal budget disimpan dalam Rupiah (IDR).
                      </p>
                    </div>
                    <SubmitButton className="btn-primary h-11 px-4" pendingText="Menyimpan...">
                      {item.budget ? "Update" : "Simpan"}
                    </SubmitButton>
                  </form>

                  {item.budget ? (
                    <form action={deleteBudget} className="mt-2">
                      <input type="hidden" name="budget_id" value={item.budget.id} />
                      <SubmitButton className="btn-secondary h-10 px-4" pendingText="Menghapus...">
                        Hapus Budget
                      </SubmitButton>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </section>

          {archivedBudgetCards.length ? (
            <section className="section-card mt-6">
              <h3 className="text-lg font-semibold">Budget Dari Kategori Arsip</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Data lama tetap ditampilkan agar riwayat budget tetap terbaca.
              </p>
              <div className="mt-4 grid gap-3">
                {archivedBudgetCards.map((item, index) => (
                  <article key={`${item.categoryName}-${index}`} className="soft-inset">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.categoryName}
                      </p>
                      <span className="chip-neutral">Arsip</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.archivedAt ? `Diarsipkan: ${formatDate(item.archivedAt)}` : "Kategori sudah tidak aktif"}
                    </p>
                    <div className="mt-3 grid gap-1 text-sm">
                      <p className="text-slate-600 dark:text-slate-300">
                        Budget: <span className="font-semibold"><CurrencyAmount amountIDR={item.budgetAmount} /></span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Terpakai: <span className="font-semibold text-rose-600"><CurrencyAmount amountIDR={item.spentAmount} /></span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Sisa: <span className={`font-semibold ${item.remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}><CurrencyAmount amountIDR={item.remaining} /></span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Terpakai {Math.round(item.usedPct)}%
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

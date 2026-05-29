import Link from "next/link";
import { revalidatePath } from "next/cache";
import AppShell from "@/components/layout/app-shell";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/supabase/auth";
import { Archive, FolderSearch } from "lucide-react";

type CategoryType = "income" | "expense";

type CategoryRow = {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  created_at: string | null;
  archived_at: string | null;
};

type UsageCounter = {
  transactions: number;
  budgets: number;
  templates: number;
  total: number;
};

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code === "42P01";
}

function parseId(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function revalidateCategoryRelatedPaths() {
  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
  revalidatePath("/transactions/[id]/edit");
  revalidatePath("/budgets");
  revalidatePath("/settings/templates");
  revalidatePath("/reports");
}

async function getOwnedCategoryOrThrow(categoryId: string) {
  const { supabase, user } = await requireUser();

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, user_id, name, type, archived_at")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (error || !category) {
    throw new Error("Kategori tidak ditemukan atau bukan milik kamu.");
  }

  return { supabase, user, category: category as CategoryRow };
}

async function createCategory(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const type = formData.get("type") as CategoryType;

  if (!name || !type) {
    throw new Error("Nama kategori dan tipe wajib diisi.");
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    type,
    archived_at: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  await revalidateCategoryRelatedPaths();
}

async function archiveCategory(formData: FormData) {
  "use server";

  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");

  const { supabase, user } = await getOwnedCategoryOrThrow(categoryId);

  const { error } = await supabase
    .from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await revalidateCategoryRelatedPaths();
}

async function unarchiveCategory(formData: FormData) {
  "use server";

  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");

  const { supabase, user } = await getOwnedCategoryOrThrow(categoryId);

  const { error } = await supabase
    .from("categories")
    .update({ archived_at: null })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await revalidateCategoryRelatedPaths();
}

async function deleteCategory(formData: FormData) {
  "use server";

  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");

  const { supabase, user } = await getOwnedCategoryOrThrow(categoryId);

  const countTransactionsPromise = supabase
    .from("transactions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .eq("category_id", categoryId);

  const countBudgetsPromise = supabase
    .from("budgets")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .eq("category_id", categoryId);

  const countTemplatesPromise = supabase
    .from("quick_add_templates")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .eq("category_id", categoryId);

  const [txCountResult, budgetCountResult, templateCountResult] = await Promise.all([
    countTransactionsPromise,
    countBudgetsPromise,
    countTemplatesPromise,
  ]);

  if (txCountResult.error) throw new Error(txCountResult.error.message);
  if (budgetCountResult.error && !isMissingTableError(budgetCountResult.error)) {
    throw new Error(budgetCountResult.error.message);
  }
  if (templateCountResult.error && !isMissingTableError(templateCountResult.error)) {
    throw new Error(templateCountResult.error.message);
  }

  const usageTotal =
    (txCountResult.count ?? 0) +
    (budgetCountResult.count ?? 0) +
    (templateCountResult.count ?? 0);

  if (usageTotal > 0) {
    throw new Error("Kategori ini masih dipakai. Arsipkan atau merge ke kategori lain.");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await revalidateCategoryRelatedPaths();
}

async function mergeCategory(formData: FormData) {
  "use server";

  const sourceId = parseId(formData, "source_id");
  const targetId = parseId(formData, "target_id");

  if (!sourceId || !targetId) {
    throw new Error("Sumber dan tujuan merge wajib dipilih.");
  }
  if (sourceId === targetId) {
    throw new Error("Kategori sumber dan tujuan tidak boleh sama.");
  }

  const { supabase, user, category: source } = await getOwnedCategoryOrThrow(sourceId);

  const { data: target, error: targetError } = await supabase
    .from("categories")
    .select("id, name, type, archived_at")
    .eq("id", targetId)
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .single();

  if (targetError || !target) {
    throw new Error("Kategori tujuan tidak valid.");
  }
  if (target.archived_at) {
    throw new Error("Kategori tujuan masih diarsipkan. Aktifkan dulu sebelum merge.");
  }
  if (target.type !== source.type) {
    throw new Error("Merge hanya boleh antar kategori dengan tipe yang sama.");
  }

  const txUpdate = await supabase
    .from("transactions")
    .update({ category_id: targetId })
    .eq("user_id", user.id)
    .eq("category_id", sourceId);
  if (txUpdate.error) throw new Error(txUpdate.error.message);

  const budgetUpdate = await supabase
    .from("budgets")
    .update({ category_id: targetId })
    .eq("user_id", user.id)
    .eq("category_id", sourceId);
  if (budgetUpdate.error && !isMissingTableError(budgetUpdate.error)) {
    throw new Error(budgetUpdate.error.message);
  }

  const templateUpdate = await supabase
    .from("quick_add_templates")
    .update({ category_id: targetId })
    .eq("user_id", user.id)
    .eq("category_id", sourceId);
  if (templateUpdate.error && !isMissingTableError(templateUpdate.error)) {
    throw new Error(templateUpdate.error.message);
  }

  const archiveSource = await supabase
    .from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", sourceId)
    .eq("user_id", user.id);
  if (archiveSource.error) throw new Error(archiveSource.error.message);

  await revalidateCategoryRelatedPaths();
}

function usageSummaryText(counter: UsageCounter) {
  if (counter.total <= 0) return "Belum dipakai";
  return `${counter.total} pemakaian`;
}

export default async function CategoriesPage() {
  const { supabase, user } = await requireUser();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, user_id, name, type, created_at, archived_at")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat kategori: ${error.message}`);
  }

  const allCategories = (categories ?? []) as CategoryRow[];
  const activeCategories = allCategories.filter((item) => !item.archived_at);
  const archivedCategories = allCategories.filter((item) => Boolean(item.archived_at));

  const userCategoryIds = allCategories
    .filter((item) => item.user_id === user.id)
    .map((item) => item.id);

  const usageMap = new Map<string, UsageCounter>();
  userCategoryIds.forEach((id) => {
    usageMap.set(id, { transactions: 0, budgets: 0, templates: 0, total: 0 });
  });

  if (userCategoryIds.length > 0) {
    const [txUsage, budgetUsage, templateUsage] = await Promise.all([
      supabase
        .from("transactions")
        .select("category_id")
        .eq("user_id", user.id)
        .in("category_id", userCategoryIds),
      supabase
        .from("budgets")
        .select("category_id")
        .eq("user_id", user.id)
        .in("category_id", userCategoryIds),
      supabase
        .from("quick_add_templates")
        .select("category_id")
        .eq("user_id", user.id)
        .in("category_id", userCategoryIds),
    ]);

    if (txUsage.error) throw new Error(txUsage.error.message);
    if (budgetUsage.error && !isMissingTableError(budgetUsage.error)) {
      throw new Error(budgetUsage.error.message);
    }
    if (templateUsage.error && !isMissingTableError(templateUsage.error)) {
      throw new Error(templateUsage.error.message);
    }

    (txUsage.data ?? []).forEach((row) => {
      const categoryId = row.category_id ?? "";
      const current = usageMap.get(categoryId);
      if (!current) return;
      current.transactions += 1;
      current.total += 1;
    });

    (budgetUsage.data ?? []).forEach((row) => {
      const categoryId = row.category_id ?? "";
      const current = usageMap.get(categoryId);
      if (!current) return;
      current.budgets += 1;
      current.total += 1;
    });

    (templateUsage.data ?? []).forEach((row) => {
      const categoryId = row.category_id ?? "";
      const current = usageMap.get(categoryId);
      if (!current) return;
      current.templates += 1;
      current.total += 1;
    });
  }

  const activeByType = {
    income: activeCategories.filter((item) => item.type === "income"),
    expense: activeCategories.filter((item) => item.type === "expense"),
  };

  const renderCategoryCard = (category: CategoryRow, archived = false) => {
    const isOwned = category.user_id === user.id;
    const usage = usageMap.get(category.id) ?? {
      transactions: 0,
      budgets: 0,
      templates: 0,
      total: 0,
    };
    const mergeTargets = activeCategories.filter(
      (target) => target.type === category.type && target.id !== category.id,
    );

    return (
      <article
        key={category.id}
        className="soft-inset space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{category.name}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {category.type === "income" ? "Kategori pemasukan" : "Kategori pengeluaran"}
            </p>
            {archived && category.archived_at ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Diarsipkan: {formatDate(category.archived_at)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={category.type === "income" ? "chip-income" : "chip-expense"}>
              {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
            </span>
            <span className={isOwned ? "chip-neutral" : "chip-neutral"}>
              {isOwned ? "Punya kamu" : "Default"}
            </span>
            {archived ? <span className="chip-neutral">Archived</span> : null}
          </div>
        </div>

        {isOwned ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {usageSummaryText(usage)} - Transaksi: {usage.transactions} - Budget: {usage.budgets} - Template: {usage.templates}
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kategori default bersifat read-only.
          </p>
        )}

        {isOwned ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {archived ? (
              <form action={unarchiveCategory}>
                <input type="hidden" name="id" value={category.id} />
                <SubmitButton className="btn-secondary h-10 w-full" pendingText="Memproses...">
                  Unarchive
                </SubmitButton>
              </form>
            ) : (
              <form action={archiveCategory}>
                <input type="hidden" name="id" value={category.id} />
                <SubmitButton className="btn-secondary h-10 w-full" pendingText="Memproses...">
                  Archive
                </SubmitButton>
              </form>
            )}

            <form action={deleteCategory}>
              <input type="hidden" name="id" value={category.id} />
              <SubmitButton className="btn-secondary h-10 w-full text-rose-600 dark:text-rose-300" pendingText="Menghapus...">
                Hapus
              </SubmitButton>
            </form>
          </div>
        ) : null}

        {isOwned ? (
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
              Merge
            </summary>
            <form action={mergeCategory} className="mt-3 space-y-3">
              <input type="hidden" name="source_id" value={category.id} />
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Kategori tujuan
                </label>
                <FormSelect
                  name="target_id"
                  defaultValue=""
                  placeholder="Pilih kategori tujuan"
                  options={[
                    { value: "", label: "Pilih kategori tujuan", disabled: true },
                    ...mergeTargets.map((target) => ({
                      value: target.id,
                      label: target.name,
                    })),
                  ]}
                  required
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semua transaksi, budget, dan template yang memakai kategori ini akan dipindahkan ke kategori tujuan.
              </p>
              <SubmitButton
                className="btn-primary h-10 px-4"
                pendingText="Merge..."
                disabled={mergeTargets.length === 0}
              >
                Merge Category
              </SubmitButton>
            </form>
          </details>
        ) : null}
      </article>
    );
  };

  return (
    <AppShell
      className="journal-categories"
      activeNav="categories"
      title="Kategori"
      description="Kelola kategori pemasukan dan pengeluaran dengan lebih rapi."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div className="section-card">
          <h2 className="text-xl font-semibold">Tambah Kategori</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tambah kategori baru sesuai kebutuhan kamu.
          </p>

          <form action={createCategory} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Nama kategori
              </label>
              <input
                type="text"
                name="name"
                placeholder="Contoh: Saham"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Tipe</label>
              <FormSelect
                name="type"
                defaultValue="expense"
                options={[
                  { value: "expense", label: "Pengeluaran" },
                  { value: "income", label: "Pemasukan" },
                ]}
                required
              />
            </div>

            <SubmitButton className="btn-primary w-full py-3" pendingText="Menyimpan...">
              Simpan Kategori
            </SubmitButton>
          </form>
        </div>

        <div className="space-y-6">
          <section className="section-card">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Active Categories</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gunakan archive untuk menyembunyikan kategori tanpa menghapus riwayat transaksi.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Gunakan merge untuk merapikan kategori duplikat.
              </p>
            </div>

            {!activeCategories.length ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-600 dark:text-slate-300">
                  <FolderSearch size={18} />
                </span>
                <p>Belum ada kategori aktif.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/transactions/new" className="btn-primary">
                    + Tambah Transaksi
                  </Link>
                  <Link href="/" className="btn-secondary">
                    Ke Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Pemasukan ({activeByType.income.length})
                  </h3>
                  <div className="space-y-3">
                    {activeByType.income.map((category) => renderCategoryCard(category))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Pengeluaran ({activeByType.expense.length})
                  </h3>
                  <div className="space-y-3">
                    {activeByType.expense.map((category) => renderCategoryCard(category))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="section-card">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Archived Categories</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Kategori arsip disembunyikan dari form transaksi/budget/template baru.
              </p>
            </div>

            {!archivedCategories.length ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-600 dark:text-slate-300">
                  <Archive size={18} />
                </span>
                <p>Belum ada kategori yang diarsipkan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedCategories.map((category) => renderCategoryCard(category, true))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

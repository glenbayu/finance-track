import Link from "next/link";
import { revalidatePath } from "next/cache";
import AppShell from "@/components/layout/app-shell";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";
import { formatDate } from "@/lib/utils/format";
import { requireUser } from "@/lib/supabase/auth";
import { Archive, FolderSearch, Tags, ChevronRight, Edit2, GripHorizontal, Check, X } from "lucide-react";

type CategoryType = "income" | "expense";

type CategoriesPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

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

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const activeTab = params?.tab || "all";

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
      <details
        key={category.id}
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:bg-slate-50/80 transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-4 p-3.5 active:bg-slate-100 outline-none list-none [&::-webkit-details-marker]:hidden dark:active:bg-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.type === "income" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"}`}>
               <Tags size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">{category.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {isOwned ? usageSummaryText(usage) : "Kategori Sistem"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {archived && category.archived_at ? (
              <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                ARSIP
              </span>
            ) : null}
            <div className="text-slate-300 transition-transform group-open:rotate-90 dark:text-slate-600">
              <ChevronRight size={18} />
            </div>
          </div>
        </summary>
        
        {/* Content Details */}
        <div className="mx-3.5 mb-3.5 mt-1 space-y-4 rounded-xl border-t border-slate-100 bg-slate-50/50 px-3.5 pb-3.5 pt-3 dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className={category.type === "income" ? "chip-income" : "chip-expense"}>
              {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
            </span>
            <span className={isOwned ? "chip-neutral" : "chip-neutral"}>
              {isOwned ? "Kustom" : "Default"}
            </span>
          </div>

          {isOwned ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Terpakai di: {usage.transactions} Transaksi • {usage.budgets} Anggaran • {usage.templates} Template
            </p>
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Kategori bawaan dari sistem ini bersifat statis (tidak bisa diubah/dihapus).
            </p>
          )}

          {isOwned ? (
            <div className="flex gap-2">
              {archived ? (
                <form action={unarchiveCategory} className="flex-1">
                  <input type="hidden" name="id" value={category.id} />
                  <SubmitButton className="btn-secondary h-9 w-full text-[13px]" pendingText="Proses...">
                    Batal Arsip
                  </SubmitButton>
                </form>
              ) : (
                <form action={archiveCategory} className="flex-1">
                  <input type="hidden" name="id" value={category.id} />
                  <SubmitButton className="btn-secondary h-9 w-full text-[13px]" pendingText="Proses...">
                    Arsipkan
                  </SubmitButton>
                </form>
              )}

              <form action={deleteCategory} className="flex-1">
                <input type="hidden" name="id" value={category.id} />
                <SubmitButton className="btn-secondary h-9 w-full text-[13px] text-rose-600 dark:text-rose-400" pendingText="Menghapus...">
                  Hapus
                </SubmitButton>
              </form>
            </div>
          ) : null}

          {isOwned ? (
            <details className="group/merge rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <summary className="flex cursor-pointer list-none items-center justify-between outline-none [&::-webkit-details-marker]:hidden text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                <span>Gabungkan (Merge) Kategori</span>
                <ChevronRight size={14} className="text-slate-400 transition-transform group-open/merge:rotate-90" />
              </summary>
              <form action={mergeCategory} className="mt-3 space-y-3">
                <input type="hidden" name="source_id" value={category.id} />
                <div>
                  <FormSelect
                    name="target_id"
                    defaultValue=""
                    placeholder="Pilih kategori tujuan..."
                    options={[
                      { value: "", label: "Pilih kategori tujuan...", disabled: true },
                      ...mergeTargets.map((target) => ({
                        value: target.id,
                        label: target.name,
                      })),
                    ]}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Data yang memakai kategori ini akan dipindahkan ke kategori tujuan di atas.
                </p>
                <SubmitButton
                  className="btn-primary h-8 px-3 text-[12px]"
                  pendingText="Merge..."
                  disabled={mergeTargets.length === 0}
                >
                  Merge Sekarang
                </SubmitButton>
              </form>
            </details>
          ) : null}
        </div>
      </details>
    );
  };

  return (
    <AppShell
      className="bg-slate-50/50 dark:bg-slate-950/50"
      activeNav="categories"
      title="Kategori Transaksi"
      description="Kelola kategori pemasukan dan pengeluaran dengan rapi."
    >
      <div className="mx-auto max-w-5xl pb-24 sm:pb-8 pt-4">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Kolom Kiri: Form Input & Arsip */}
          <div className="space-y-6 lg:col-span-5">
            {/* Add New Category Section */}
            <section className="px-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">Buat Kategori Baru</h2>
                
                <form action={createCategory} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Nama kategori
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Contoh: Belanja Bulanan"
                      className="input-base bg-slate-50 dark:bg-slate-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Tipe</label>
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

                  <SubmitButton className="btn-primary w-full py-3.5 mt-2 rounded-xl text-[15px] font-semibold" pendingText="Menyimpan...">
                    Simpan Kategori Baru
                  </SubmitButton>
                </form>
              </div>
            </section>

            {/* Archived Categories Section */}
            <section className="px-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white mb-4">Arsip Kategori</h2>

                {!archivedCategories.length ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tidak ada kategori yang diarsipkan saat ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {archivedCategories.map((category) => renderCategoryCard(category, true))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Kolom Kanan: Kategori Aktif */}
          <div className="space-y-6 lg:col-span-7">
            {/* Active Categories Section */}
            <section className="px-2">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Kategori Aktif</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Gunakan fitur <span className="font-medium text-slate-700 dark:text-slate-300">arsip</span> untuk menyembunyikan kategori.
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 w-full sm:w-64 shrink-0">
                  <Link
                    href="/categories?tab=all"
                    scroll={false}
                    className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                      activeTab === "all"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Semua
                  </Link>
                  <Link
                    href="/categories?tab=income"
                    scroll={false}
                    className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                      activeTab === "income"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Pemasukan
                  </Link>
                  <Link
                    href="/categories?tab=expense"
                    scroll={false}
                    className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition-all ${
                      activeTab === "expense"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Pengeluaran
                  </Link>
                </div>
              </div>

              {!activeCategories.length ? (
                <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <FolderSearch size={24} />
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Belum ada kategori aktif.</p>
                  <div className="mt-6 flex flex-col w-full gap-3">
                    <Link href="/transactions/new" className="btn-primary flex items-center justify-center gap-2">
                      <span>+</span> Tambah Transaksi
                    </Link>
                    <Link href="/" className="btn-secondary flex items-center justify-center">
                      Kembali ke Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pemasukan Group */}
                  {(activeTab === "all" || activeTab === "income") && activeByType.income.length > 0 && (
                    <div>
                      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">
                        Pemasukan ({activeByType.income.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeByType.income.map((category) => renderCategoryCard(category))}
                      </div>
                    </div>
                  )}
                  
                  {/* Pengeluaran Group */}
                  {(activeTab === "all" || activeTab === "expense") && activeByType.expense.length > 0 && (
                    <div>
                      <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">
                        Pengeluaran ({activeByType.expense.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeByType.expense.map((category) => renderCategoryCard(category))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

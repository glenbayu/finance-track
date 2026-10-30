"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

type CategoryType = "income" | "expense";

type CategoryRow = {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  created_at: string | null;
  archived_at: string | null;
};

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code === "42P01";
}

function parseId(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function revalidateCategoryRelatedPaths() {
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

export async function createCategory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const rawType = formData.get("type");

  if (!name || (rawType !== "income" && rawType !== "expense")) {
    throw new Error("Nama kategori dan tipe wajib diisi.");
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    type: rawType,
    archived_at: null,
  });

  if (error) throw new Error("Kategori gagal disimpan.");
  revalidateCategoryRelatedPaths();
}

export async function editCategory(formData: FormData) {
  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");

  const { supabase, user, category } = await getOwnedCategoryOrThrow(categoryId);
  const name = String(formData.get("name") || "").trim();
  const rawType = formData.get("type");
  if (rawType !== "income" && rawType !== "expense") {
    throw new Error("Tipe kategori tidak valid.");
  }
  if (!name) throw new Error("Nama kategori wajib diisi.");

  if (rawType !== category.type) {
    const [transactionUsage, budgetUsage, templateUsage] = await Promise.all([
      supabase.from("transactions").select("id", { head: true, count: "exact" })
        .eq("user_id", user.id).eq("category_id", categoryId),
      supabase.from("budgets").select("id", { head: true, count: "exact" })
        .eq("user_id", user.id).eq("category_id", categoryId),
      supabase.from("quick_add_templates").select("id", { head: true, count: "exact" })
        .eq("user_id", user.id).eq("category_id", categoryId),
    ]);

    if (transactionUsage.error) throw new Error("Penggunaan kategori gagal diperiksa.");
    if (budgetUsage.error && !isMissingTableError(budgetUsage.error)) {
      throw new Error("Penggunaan budget gagal diperiksa.");
    }
    if (templateUsage.error && !isMissingTableError(templateUsage.error)) {
      throw new Error("Penggunaan template gagal diperiksa.");
    }

    const usageCount =
      (transactionUsage.count ?? 0) +
      (budgetUsage.error ? 0 : budgetUsage.count ?? 0) +
      (templateUsage.error ? 0 : templateUsage.count ?? 0);

    if (usageCount > 0) {
      throw new Error(
        "Tipe kategori tidak bisa diubah karena masih dipakai transaksi, anggaran, atau template. Kamu masih bisa mengganti namanya.",
      );
    }
  }

  const { error } = await supabase
    .from("categories")
    .update({ name, type: rawType })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error("Kategori gagal diperbarui.");
  revalidateCategoryRelatedPaths();
}

export async function archiveCategory(formData: FormData) {
  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");
  const { supabase, user } = await getOwnedCategoryOrThrow(categoryId);

  const { error } = await supabase
    .from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error("Kategori gagal diarsipkan.");
  revalidateCategoryRelatedPaths();
}

export async function unarchiveCategory(formData: FormData) {
  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");
  const { supabase, user } = await getOwnedCategoryOrThrow(categoryId);

  const { error } = await supabase
    .from("categories")
    .update({ archived_at: null })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error("Kategori gagal diaktifkan kembali.");
  revalidateCategoryRelatedPaths();
}

export async function deleteCategory(formData: FormData) {
  const categoryId = parseId(formData, "id");
  if (!categoryId) throw new Error("ID kategori tidak valid.");
  const { supabase, user } = await getOwnedCategoryOrThrow(categoryId);

  const [txCountResult, budgetCountResult, templateCountResult] = await Promise.all([
    supabase.from("transactions").select("id", { head: true, count: "exact" })
      .eq("user_id", user.id).eq("category_id", categoryId),
    supabase.from("budgets").select("id", { head: true, count: "exact" })
      .eq("user_id", user.id).eq("category_id", categoryId),
    supabase.from("quick_add_templates").select("id", { head: true, count: "exact" })
      .eq("user_id", user.id).eq("category_id", categoryId),
  ]);

  if (txCountResult.error) throw new Error("Penggunaan kategori gagal diperiksa.");
  if (budgetCountResult.error && !isMissingTableError(budgetCountResult.error)) {
    throw new Error("Penggunaan budget gagal diperiksa.");
  }
  if (templateCountResult.error && !isMissingTableError(templateCountResult.error)) {
    throw new Error("Penggunaan template gagal diperiksa.");
  }

  const usageTotal =
    (txCountResult.count ?? 0) +
    (budgetCountResult.error ? 0 : budgetCountResult.count ?? 0) +
    (templateCountResult.error ? 0 : templateCountResult.count ?? 0);

  if (usageTotal > 0) {
    throw new Error("Kategori ini masih dipakai. Arsipkan atau merge ke kategori lain.");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error("Kategori gagal dihapus.");
  revalidateCategoryRelatedPaths();
}

export async function mergeCategory(formData: FormData) {
  const sourceId = parseId(formData, "source_id");
  const targetId = parseId(formData, "target_id");

  if (!sourceId || !targetId) throw new Error("Sumber dan tujuan merge wajib dipilih.");
  if (sourceId === targetId) throw new Error("Kategori sumber dan tujuan tidak boleh sama.");

  const { supabase, user, category: source } = await getOwnedCategoryOrThrow(sourceId);
  const { data: target, error: targetError } = await supabase
    .from("categories")
    .select("id, name, type, archived_at")
    .eq("id", targetId)
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .single();

  if (targetError || !target) throw new Error("Kategori tujuan tidak valid.");
  if (target.archived_at) throw new Error("Kategori tujuan masih diarsipkan. Aktifkan dulu sebelum merge.");
  if (target.type !== source.type) throw new Error("Merge hanya boleh antar kategori dengan tipe yang sama.");

  const txUpdate = await supabase.from("transactions").update({ category_id: targetId })
    .eq("user_id", user.id).eq("category_id", sourceId);
  if (txUpdate.error) throw new Error("Transaksi kategori gagal dipindahkan.");

  const budgetUpdate = await supabase.from("budgets").update({ category_id: targetId })
    .eq("user_id", user.id).eq("category_id", sourceId);
  if (budgetUpdate.error && !isMissingTableError(budgetUpdate.error)) {
    throw new Error("Budget kategori gagal dipindahkan.");
  }

  const templateUpdate = await supabase.from("quick_add_templates").update({ category_id: targetId })
    .eq("user_id", user.id).eq("category_id", sourceId);
  if (templateUpdate.error && !isMissingTableError(templateUpdate.error)) {
    throw new Error("Template kategori gagal dipindahkan.");
  }

  const archiveSource = await supabase.from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", sourceId).eq("user_id", user.id);
  if (archiveSource.error) throw new Error("Kategori sumber gagal diarsipkan.");

  revalidateCategoryRelatedPaths();
}

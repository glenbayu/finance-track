"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function sanitizeMonth(value: FormDataEntryValue | null) {
  const month = String(value || "");
  if (!MONTH_REGEX.test(month)) {
    throw new Error("Format bulan tidak valid. Gunakan YYYY-MM.");
  }
  return month;
}

function revalidateBudgetPaths() {
  revalidatePath("/budgets");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/transactions");
}

export async function upsertBudget(formData: FormData) {
  const { supabase, user } = await requireUser();
  const categoryId = String(formData.get("category_id") || "").trim();
  const month = sanitizeMonth(formData.get("month"));
  const amount = Number(formData.get("amount"));

  if (!categoryId) throw new Error("Kategori wajib dipilih.");
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
    { onConflict: "user_id,category_id,month", ignoreDuplicates: false },
  );

  if (error) throw new Error("Budget gagal disimpan.");
  revalidateBudgetPaths();
}

export async function deleteBudget(formData: FormData) {
  const { supabase, user } = await requireUser();
  const budgetId = String(formData.get("budget_id") || "").trim();

  if (!budgetId) throw new Error("Budget tidak valid.");

  const { data: budget, error: readError } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .single();

  if (readError || !budget) throw new Error("Budget tidak ditemukan.");

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id);

  if (error) throw new Error("Budget gagal dihapus.");
  revalidateBudgetPaths();
}

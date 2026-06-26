"use server";

import { revalidatePath } from "next/cache";
import { getCurrentDate, isDateValue } from "@/lib/date";
import { requireUser } from "@/lib/supabase/auth";

type QuickAddResult = {
  ok: boolean;
  error?: string;
  transactionId?: string;
};

function revalidateQuickAddPaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/budgets");
  revalidatePath("/settings/templates");
}

function normalizeTransactionDate(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return getCurrentDate();
  return isDateValue(raw) ? raw : getCurrentDate();
}

function normalizeTemplateType(value: unknown): "income" | "expense" | null {
  const type = String(value ?? "");
  if (type === "income" || type === "expense") return type;
  return null;
}

export async function createTransactionFromTemplate(input: {
  templateId: string;
  transactionDate?: string;
}): Promise<QuickAddResult> {
  const { supabase, user } = await requireUser();
  const templateId = String(input.templateId ?? "").trim();

  if (!templateId) {
    return { ok: false, error: "Template tidak valid." };
  }

  const { data: template, error: templateError } = await supabase
    .from("quick_add_templates")
    .select("id, user_id, type, category_id, amount, note, is_active, use_count")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (templateError || !template) {
    return { ok: false, error: "Template tidak ditemukan." };
  }
  if (!template.is_active) {
    return { ok: false, error: "Template sedang nonaktif." };
  }

  const type = normalizeTemplateType(template.type);
  if (!type) {
    return { ok: false, error: "Tipe template tidak valid." };
  }

  const amount = Number(template.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Nominal template belum valid." };
  }

  let categoryId: string | null = template.category_id ? String(template.category_id) : null;
  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .maybeSingle();

    if (categoryError || !category || category.type !== type) {
      categoryId = null;
    }
  }

  const transactionDate = normalizeTransactionDate(input.transactionDate);

  const { data: inserted, error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type,
      category_id: categoryId,
      amount,
      note: template.note ? String(template.note) : null,
      transaction_date: transactionDate,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Gagal menambah transaksi." };
  }

  // Best effort usage tracking: transaction success is source of truth.
  try {
    const nextCount = Math.max(0, Number(template.use_count ?? 0)) + 1;
    await supabase
      .from("quick_add_templates")
      .update({
        use_count: nextCount,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("user_id", user.id);
  } catch (error) {
    console.error("Quick add template usage tracking failed", error);
  }

  revalidateQuickAddPaths();
  return { ok: true, transactionId: inserted.id };
}

export async function undoQuickAddTransaction(input: {
  transactionId: string;
}): Promise<QuickAddResult> {
  const { supabase, user } = await requireUser();
  const transactionId = String(input.transactionId ?? "").trim();
  if (!transactionId) {
    return { ok: false, error: "Transaksi tidak valid." };
  }

  const { data: existing, error: readError } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !existing) {
    return { ok: false, error: "Transaksi tidak ditemukan." };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateQuickAddPaths();
  return { ok: true };
}

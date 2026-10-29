"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import {
  createTransactionFromTemplateForUser,
  type QuickAddSupabaseLike,
  type QuickAddResult,
} from "@/lib/transactions/quick-add-action-core";

function revalidateQuickAddPaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/budgets");
  revalidatePath("/settings/templates");
}

export async function createTransactionFromTemplate(input: {
  templateId: string;
  transactionDate?: string;
}): Promise<QuickAddResult> {
  const { supabase, user } = await requireUser();
  // Supabase's recursive generic builders exceed TypeScript's inference depth here;
  // the core boundary still requires the exact query methods used below.
  const result = await createTransactionFromTemplateForUser(
    supabase as unknown as QuickAddSupabaseLike,
    user,
    input,
  );
  if (result.ok) revalidateQuickAddPaths();
  return result;
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

// @ts-expect-error Node's strip-types test runner requires explicit TS extensions.
import { getCurrentDate, isDateValue } from "../utils/date.ts";
// @ts-expect-error Node's strip-types test runner requires explicit TS extensions.
import { isCompatibleQuickAddCategory } from "./quick-add.ts";

type QuickAddError = {
  message: string;
};

type QuickAddResultRow = {
  data: unknown;
  error: QuickAddError | null;
};

type QuickAddResultLike = PromiseLike<QuickAddResultRow>;

type QuickAddQuery = {
  select(
    columns?: string,
    options?: { head?: boolean; count?: "exact" | "planned" | "estimated" },
  ): QuickAddQuery;
  eq(column: string, value: unknown): QuickAddQuery;
  or(expression: string): QuickAddQuery;
  is(column: string, value: unknown): QuickAddQuery;
  order(column: string, options: { ascending: boolean }): QuickAddQuery;
  limit(count: number): QuickAddQuery;
  maybeSingle(): QuickAddResultLike;
  single(): QuickAddResultLike;
};

type QuickAddTable = {
  select(
    columns?: string,
    options?: { head?: boolean; count?: "exact" | "planned" | "estimated" },
  ): QuickAddQuery;
  insert(values: Record<string, unknown>): QuickAddQuery;
  update(values: Record<string, unknown>): QuickAddQuery;
};

export type QuickAddSupabaseLike = {
  from(table: string): QuickAddTable;
};

export type QuickAddUser = {
  id: string;
};

export type QuickAddResult = {
  ok: boolean;
  error?: string;
  transactionId?: string;
};

type QuickAddTemplateRow = {
  type: unknown;
  category_id: unknown;
  amount: unknown;
  note: unknown;
  is_active: boolean;
  use_count: unknown;
};

type QuickAddCategoryRow = {
  type?: unknown;
  archived_at?: string | null;
};

type QuickAddWalletRow = {
  id?: unknown;
};

type QuickAddInsertedRow = {
  id?: unknown;
};

function normalizeTransactionDate(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: getCurrentDate() };
  if (!isDateValue(raw)) return { error: "Tanggal transaksi tidak valid." };
  return { date: raw };
}

function normalizeTemplateType(value: unknown): "income" | "expense" | null {
  const type = String(value ?? "");
  if (type === "income" || type === "expense") return type;
  return null;
}

export async function createTransactionFromTemplateForUser(
  supabase: QuickAddSupabaseLike,
  user: QuickAddUser,
  input: { templateId: string; transactionDate?: string },
): Promise<QuickAddResult> {
  const dateResult = normalizeTransactionDate(input?.transactionDate);
  if (dateResult.error) return { ok: false, error: dateResult.error };

  const templateId = String(input?.templateId ?? "").trim();
  if (!templateId) {
    return { ok: false, error: "Template tidak valid." };
  }

  const { data: templateData, error: templateError } = await supabase
    .from("quick_add_templates")
    .select("id, user_id, type, category_id, amount, note, is_active, use_count")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .maybeSingle();

  const template = templateData as QuickAddTemplateRow | null;
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

  const categoryId: string | null = template.category_id ? String(template.category_id) : null;
  if (categoryId) {
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id, type, archived_at")
      .eq("id", categoryId)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .maybeSingle();

    const category = categoryData as QuickAddCategoryRow | null;
    if (
      categoryError ||
      category?.archived_at ||
      !isCompatibleQuickAddCategory(category, type)
    ) {
      return { ok: false, error: "Kategori template tidak valid atau sudah tidak tersedia." };
    }
  }

  const { data: firstWalletData, error: walletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const firstWallet = firstWalletData as QuickAddWalletRow | null;
  if (walletError) {
    return { ok: false, error: "Dompet tidak dapat dimuat." };
  }
  const walletId = firstWallet?.id ? String(firstWallet.id) : null;
  if (!walletId) {
    return { ok: false, error: "Dompet tidak ditemukan untuk user ini." };
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type,
      category_id: categoryId,
      wallet_id: walletId,
      amount,
      note: template.note ? String(template.note) : null,
      transaction_date: dateResult.date,
    })
    .select("id")
    .single();

  const inserted = insertedData as QuickAddInsertedRow | null;
  if (insertError || !inserted?.id) {
    return { ok: false, error: "Gagal menambah transaksi." };
  }

  // Best effort usage tracking: transaction success is the source of truth.
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

  return { ok: true, transactionId: String(inserted.id) };
}

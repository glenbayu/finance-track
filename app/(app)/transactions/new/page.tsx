import { redirect } from "next/navigation";
import Link from "next/link";
import TransactionForm from "@/components/transactions/transaction-form";
import { revalidatePath } from "next/cache";
import AppShell from "@/components/layout/app-shell";
import QuickAddTemplateCard from "@/components/quick-add/quick-add-template-card";
import type { QuickAddTemplateType } from "@/lib/quick-add";
import { byTemplateSort, mapQuickAddTemplateRow } from "@/lib/quick-add";
import { getCurrentDate, isDateValue } from "@/lib/date";
import { requireUser } from "@/lib/supabase/auth";

const NOTE_MAX_LENGTH = 140;

async function createTransaction(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const type = formData.get("type") as "income" | "expense" | "transfer";
  const amount = Number(formData.get("amount"));
  const categoryId = formData.get("category_id") as string;
  const walletId = formData.get("wallet_id") as string;
  const destinationWalletId = formData.get("destination_wallet_id") as string;
  const rawNote = String(formData.get("note") || "").trim();
  const note = rawNote ? rawNote.slice(0, NOTE_MAX_LENGTH) : null;
  const transactionDate = formData.get("transaction_date") as string;

  if (!type || !transactionDate || !walletId) {
    throw new Error("Data transaksi belum lengkap.");
  }

  if (type !== "transfer" && !categoryId) {
    throw new Error("Kategori harus dipilih.");
  }

  if (type === "transfer" && (!destinationWalletId || walletId === destinationWalletId)) {
    throw new Error("Dompet tujuan tidak valid.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Jumlah transaksi harus lebih dari 0.");
  }

  if (!isDateValue(transactionDate)) {
    throw new Error("Tanggal transaksi tidak valid.");
  }

  let validCategoryId = categoryId;
  if (type !== "transfer") {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .single();

    if (categoryError || !category) {
      throw new Error("Kategori tidak valid.");
    }
    validCategoryId = category.id;
  } else {
    validCategoryId = null as any; // Allow null for transfer
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    category_id: validCategoryId,
    wallet_id: walletId,
    destination_wallet_id: type === "transfer" ? destinationWalletId : null,
    note,
    transaction_date: transactionDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  redirect("/transactions");
}

type NewTransactionPageProps = {
  searchParams?: Promise<{
    templateId?: string;
    duplicateId?: string;
    type?: string;
    source_id?: string;
  }>;
};

export default async function NewTransactionPage({ searchParams }: NewTransactionPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const templateId = String(params?.templateId ?? "").trim();
  const duplicateId = String(params?.duplicateId ?? "").trim();
  const typeParam = String(params?.type ?? "").trim();
  const sourceIdParam = String(params?.source_id ?? "").trim();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .is("archived_at", null)
    .order("name", { ascending: true });

  const { data: wallets, error: walletsError } = await supabase
    .from("wallets")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error || walletsError) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <p className="text-red-600">Gagal load data: {error?.message || walletsError?.message}</p>
        </div>
      </main>
    );
  }

  const today = getCurrentDate();
  const recentCategoryMap = new Map<
    string,
    { id: string; name: string; type: "income" | "expense"; count: number }
  >();

  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(
      `
      category_id,
      categories (
        id,
        name,
        type,
        archived_at
      )
    `,
    )
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  (recentTransactions ?? []).forEach((row) => {
    const relation = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    if (!relation?.id || !relation?.name || !relation?.type) return;
    if (relation.archived_at) return;
    const current = recentCategoryMap.get(relation.id) ?? {
      id: relation.id,
      name: relation.name,
      type: relation.type === "income" ? "income" : "expense",
      count: 0,
    };
    current.count += 1;
    recentCategoryMap.set(relation.id, current);
  });
  const recentCategories = Array.from(recentCategoryMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  let infoMessage: string | null = null;
  let initialValues: {
    type?: QuickAddTemplateType | "transfer";
    categoryId?: string | null;
    amountIDR?: number | null;
    note?: string | null;
    walletId?: string;
  } = {};

  if (typeParam === "transfer") {
    initialValues = {
      type: "transfer",
      walletId: sourceIdParam || undefined
    };
    infoMessage = "Mode transfer. Silakan masukkan nominal dan dompet tujuan.";
  } else if (duplicateId) {
    const { data: sourceTransaction, error: sourceError } = await supabase
      .from("transactions")
      .select("id, type, category_id, amount, note")
      .eq("id", duplicateId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sourceError && sourceTransaction) {
      const safeType = sourceTransaction.type === "income" ? "income" : "expense";
      const categoryStillValid = categories?.some(
        (category) => category.id === sourceTransaction.category_id && category.type === safeType,
      );
      initialValues = {
        type: safeType,
        categoryId: categoryStillValid ? sourceTransaction.category_id : null,
        amountIDR: Number.isFinite(Number(sourceTransaction.amount))
          ? Number(sourceTransaction.amount)
          : null,
        note: typeof sourceTransaction.note === "string" ? sourceTransaction.note : null,
      };
      infoMessage = "Form sudah diisi dari transaksi sebelumnya. Tanggal otomatis di-set ke hari ini.";
    } else if (!sourceError) {
      infoMessage = "Transaksi sumber tidak ditemukan. Form dibuka dengan mode manual.";
    }
  } else if (templateId) {
    const { data: template, error: templateError } = await supabase
      .from("quick_add_templates")
      .select("id, type, category_id, amount, note, is_active")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!templateError && template?.is_active) {
      const safeType = template.type === "income" ? "income" : "expense";
      const categoryStillValid = categories?.some(
        (category) => category.id === template.category_id && category.type === safeType,
      );
      initialValues = {
        type: safeType,
        categoryId: categoryStillValid ? template.category_id : null,
        amountIDR: Number.isFinite(Number(template.amount)) ? Number(template.amount) : null,
        note: typeof template.note === "string" ? template.note : null,
      };
      infoMessage = "Form sudah diisi dari template. Silakan cek lagi lalu simpan transaksi.";
    } else if (!templateError) {
      infoMessage = "Template tidak aktif atau tidak ditemukan. Form dibuka dengan mode manual.";
    }
  }

  const { data: activeTemplateRows } = await supabase
    .from("quick_add_templates")
    .select(`
      id,
      user_id,
      name,
      type,
      category_id,
      amount,
      note,
      icon,
      color,
      is_active,
      sort_order,
      created_at,
      categories (
        name
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(6);

  const activeTemplates = ((activeTemplateRows ?? []) as Record<string, unknown>[])
    .map(mapQuickAddTemplateRow)
    .sort(byTemplateSort);

  return (
    <AppShell
      className="journal-entry"
      containerClassName="max-w-6xl"
      contentClassName="max-w-3xl"
      activeNav="add"
      title="Tambah Transaksi"
      description="Catat pemasukan atau pengeluaran baru."
    >
      {activeTemplates.length ? (
        <section className="section-card mt-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Pilih Template Cepat</h2>
            <Link
              href="/settings/templates"
              className="text-xs font-semibold text-slate-700 underline underline-offset-4 dark:text-slate-200"
            >
              Kelola
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeTemplates.map((template) => (
              <QuickAddTemplateCard key={template.id} template={template} variant="default" />
            ))}
          </div>
          <div className="mt-3">
            <Link href="/transactions/new" className="btn-secondary h-10 px-4">
              Tambah Manual
            </Link>
          </div>
        </section>
      ) : null}

      <TransactionForm
        key={`tx-form-${templateId || "manual"}`}
        categories={categories ?? []}
        wallets={wallets ?? []}
        recentCategories={recentCategories}
        defaultDate={today}
        action={createTransaction}
        initialValues={initialValues}
        infoMessage={infoMessage}
      />
    </AppShell>
  );
}

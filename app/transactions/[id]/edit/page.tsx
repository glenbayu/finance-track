import { notFound, redirect } from "next/navigation";
import TransactionEditForm from "@/components/transactions/transaction-edit-form";
import LogoutButton from "@/components/auth/logout-button";
import AppShell from "@/components/layout/app-shell";
import { isDateValue } from "@/lib/date";
import { requireUser } from "@/lib/supabase/auth";
import Link from "next/link";

const NOTE_MAX_LENGTH = 140;

type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateTransaction(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const id = formData.get("id") as string;
  const type = formData.get("type") as "income" | "expense";
  const amount = Number(formData.get("amount"));
  const categoryId = formData.get("category_id") as string;
  const rawNote = String(formData.get("note") || "").trim();
  const note = rawNote ? rawNote.slice(0, NOTE_MAX_LENGTH) : null;
  const transactionDate = formData.get("transaction_date") as string;

  if (!id || !type || !categoryId || !transactionDate) {
    throw new Error("Data transaksi belum lengkap.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Jumlah transaksi harus lebih dari 0.");
  }

  if (!isDateValue(transactionDate)) {
    throw new Error("Tanggal transaksi tidak valid.");
  }

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

  const { error } = await supabase
    .from("transactions")
    .update({
      type,
      amount,
      category_id: categoryId,
      note,
      transaction_date: transactionDate,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/transactions");
}

export default async function EditTransactionPage({ params }: EditPageProps) {
  const { supabase, user } = await requireUser();
  const { id } = await params;

  const [{ data: transaction, error: transactionError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", id)
        .single(),
      supabase
        .from("categories")
        .select("id, name, type")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .is("archived_at", null)
        .order("name", { ascending: true }),
    ]);

  if (transactionError || !transaction) {
    notFound();
  }

  if (categoriesError) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <p className="text-red-600">
            Gagal load kategori: {categoriesError.message}
          </p>
        </div>
      </main>
    );
  }

  let categoryOptions = categories ?? [];
  if (
    transaction.category_id &&
    !categoryOptions.some((category) => category.id === transaction.category_id)
  ) {
    const { data: archivedCategory } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("id", transaction.category_id)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .maybeSingle();

    if (archivedCategory) {
      categoryOptions = [archivedCategory, ...categoryOptions];
    }
  }

  return (
    <AppShell
      className="journal-entry"
      containerClassName="max-w-6xl"
      contentClassName="max-w-3xl"
      activeNav="transactions"
      title="Edit Transaksi"
      description="Ubah data transaksi yang sudah ada."
      headerActions={
        <>
          <Link
            href={`/transactions/new?duplicateId=${encodeURIComponent(id)}`}
            className="btn-secondary"
          >
            Duplikat
          </Link>
          <Link href="/transactions" className="btn-secondary">
            Kembali ke daftar
          </Link>
          <LogoutButton className="btn-secondary gap-2" />
        </>
      }
      mobileActions={
        <div className="flex w-full items-center gap-2">
          <Link
            href={`/transactions/new?duplicateId=${encodeURIComponent(id)}`}
            className="btn-secondary h-10 flex-1"
          >
            Duplikat
          </Link>
          <Link href="/transactions" className="btn-secondary h-10 flex-1">
            Kembali ke daftar
          </Link>
          <LogoutButton
            iconOnly
            className="btn-secondary h-10 w-10 shrink-0 justify-center px-0"
          />
        </div>
      }
    >
      <TransactionEditForm
        transaction={transaction}
        categories={categoryOptions}
        action={updateTransaction}
      />
    </AppShell>
  );
}

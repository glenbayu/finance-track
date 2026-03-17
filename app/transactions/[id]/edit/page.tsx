import { notFound, redirect } from "next/navigation";
import TransactionEditForm from "@/components/transaction-edit-form";
import LogoutButton from "@/components/logout-button";
import { requireUser } from "@/lib/supabase/auth";
import Link from "next/link";

const NOTE_MAX_LENGTH = 140;

type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isValidISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

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

  if (!isValidISODate(transactionDate)) {
    throw new Error("Tanggal transaksi tidak valid.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .or(`user_id.eq.${user.id},user_id.is.null`)
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

  return (
    <main className="page-shell">
      <div className="page-container max-w-3xl">
        <div className="hero-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Edit Transaksi</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Ubah data transaksi yang sudah ada.
              </p>
            </div>

            <Link href="/transactions" className="btn-secondary">
              Kembali ke daftar
            </Link>

            <LogoutButton className="btn-secondary gap-2" />
          </div>
        </div>

        <TransactionEditForm
          transaction={transaction}
          categories={categories ?? []}
          action={updateTransaction}
        />
      </div>
    </main>
  );
}

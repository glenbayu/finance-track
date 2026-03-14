import { notFound, redirect } from "next/navigation";
import TransactionEditForm from "@/components/transaction-edit-form";
import LogoutButton from "@/components/logout-button";
import { requireUser } from "@/lib/supabase/auth";
import Link from "next/link";

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
  const note = (formData.get("note") as string) || null;
  const transactionDate = formData.get("transaction_date") as string;

  if (!id || !type || !amount || !categoryId || !transactionDate) {
    throw new Error("Data transaksi belum lengkap.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", user.id)
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
        .eq("user_id", user.id)
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

import { redirect } from "next/navigation";
import TransactionForm from "@/components/transaction-form";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { requireUser } from "@/lib/supabase/auth";
import { ReceiptText } from "lucide-react";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

async function createTransaction(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const type = formData.get("type") as "income" | "expense";
  const amount = Number(formData.get("amount"));
  const categoryId = formData.get("category_id") as string;
  const note = (formData.get("note") as string) || null;
  const transactionDate = formData.get("transaction_date") as string;

  if (!type || !amount || !transactionDate || !categoryId) {
    throw new Error("Data transaksi belum lengkap.");
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

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    category_id: categoryId,
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

export default async function NewTransactionPage() {
  const { supabase, user } = await requireUser();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name", { ascending: true });

  if (error) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <p className="text-red-600">Gagal load kategori: {error.message}</p>
        </div>
      </main>
    );
  }

  const today = formatDateOnly(new Date());

  return (
    <main className="page-shell">
      <div className="page-container max-w-3xl">
        <div className="hero-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Tambah Transaksi</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Catat pemasukan atau pengeluaran baru.
              </p>
            </div>

            <Link href="/transactions" className="btn-secondary gap-2">
              <ReceiptText size={16} />
              Kembali ke daftar
            </Link>

            <LogoutButton className="btn-secondary gap-2" />
          </div>
        </div>

        <TransactionForm
          categories={categories ?? []}
          defaultDate={today}
          action={createTransaction}
        />
      </div>
    </main>
  );
}

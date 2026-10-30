import { notFound } from "next/navigation";
import TransactionEditForm from "@/components/transactions/transaction-edit-form";
import AppShell from "@/components/layout/app-shell";
import { requireUser } from "@/lib/supabase/auth";
import { TransactionReturnLink } from "@/components/transactions/transaction-list-context";
import {
  deleteTransactionAndRedirect,
  updateTransaction,
} from "@/app/(app)/transactions/actions";

type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTransactionPage({ params }: EditPageProps) {
  const { supabase, user } = await requireUser();
  const { id } = await params;

  const [
    { data: transaction, error: transactionError },
    { data: categories, error: categoriesError },
    { data: wallets, error: walletsError },
  ] = await Promise.all([
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
    supabase
      .from("wallets")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  if (transactionError || !transaction) {
    notFound();
  }

  if (categoriesError || walletsError) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <p className="text-red-600">
            Gagal load data: {categoriesError?.message || walletsError?.message}
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
      contentClassName="max-w-xl mx-auto"
      activeNav="transactions"
      title="Edit Transaksi"
      description="Ubah data transaksi yang sudah ada."
      layoutStyle="default"
      backPath="/transactions"
      headerActions={
        // Duplikat & Hapus sekarang ada di bagian bawah form; Batal ada di bar aksi utama.
        <TransactionReturnLink className="btn-secondary">Kembali</TransactionReturnLink>
      }
    >
      <TransactionEditForm
        transaction={transaction}
        categories={categoryOptions}
        wallets={wallets ?? []}
        action={updateTransaction}
        deleteAction={deleteTransactionAndRedirect}
      />
    </AppShell>
  );
}

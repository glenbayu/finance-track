import Link from "next/link";
import { revalidatePath } from "next/cache";
import AppShell from "@/components/layout/app-shell";
import { requireUser } from "@/lib/supabase/auth";
import WalletManager from "@/components/wallets/wallet-manager";

async function revalidateWalletRelatedPaths() {
  revalidatePath("/wallets");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
  revalidatePath("/reports");
}

import MonthFilter from "@/components/ui/month-filter";
import { getCurrentMonth, getMonthRange } from "@/lib/date";

export type WalletsPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const selectedMonth = params?.month || getCurrentMonth();
  const { start, end } = getMonthRange(selectedMonth);

  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("id, name, type, created_at")
    .eq("user_id", user.id)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat dompet: ${error.message}`);
  }

  // Get usage to prevent deleting used wallets
  const walletIds = wallets.map(w => w.id);
  const usageMap = new Map<string, number>();
  const balanceMap = new Map<string, number>();
  
  if (walletIds.length > 0) {
    const { data: txData } = await supabase
      .from("transactions")
      .select("type, amount, wallet_id, destination_wallet_id")
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lt("transaction_date", end);

    walletIds.forEach(id => {
      usageMap.set(id, 0);
      balanceMap.set(id, 0);
    });
    
    txData?.forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.wallet_id) {
        usageMap.set(tx.wallet_id, (usageMap.get(tx.wallet_id) || 0) + 1);
      }
      if (tx.destination_wallet_id) {
        usageMap.set(tx.destination_wallet_id, (usageMap.get(tx.destination_wallet_id) || 0) + 1);
      }

      if (tx.type === 'income' && tx.wallet_id) {
        balanceMap.set(tx.wallet_id, (balanceMap.get(tx.wallet_id) || 0) + amt);
      } else if (tx.type === 'expense' && tx.wallet_id) {
        balanceMap.set(tx.wallet_id, (balanceMap.get(tx.wallet_id) || 0) - amt);
      } else if (tx.type === 'adjustment' && tx.wallet_id) {
        balanceMap.set(tx.wallet_id, (balanceMap.get(tx.wallet_id) || 0) + amt);
      } else if (tx.type === 'transfer') {
        if (tx.wallet_id) {
          balanceMap.set(tx.wallet_id, (balanceMap.get(tx.wallet_id) || 0) - amt);
        }
        if (tx.destination_wallet_id) {
          balanceMap.set(tx.destination_wallet_id, (balanceMap.get(tx.destination_wallet_id) || 0) + amt);
        }
      }
    });
  }

  const walletsWithUsage = wallets.map(w => ({
    ...w,
    usageCount: usageMap.get(w.id) || 0,
    balance: balanceMap.get(w.id) || 0
  }));

  async function adjustWalletBalance(formData: FormData) {
    "use server";
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") || "").trim();
    const newBalance = Number(formData.get("balance") || 0);
    const currentBalance = Number(formData.get("current_balance") || 0);

    if (!id) throw new Error("ID dompet tidak valid.");

    const difference = newBalance - currentBalance;
    if (difference === 0) return; // Nothing to adjust

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "adjustment",
      amount: difference, // Can be negative
      wallet_id: id,
      note: "Penyesuaian Saldo (Adjust Balance)",
      transaction_date: new Date().toISOString().split("T")[0],
    });

    if (error) throw new Error(error.message);
    await revalidateWalletRelatedPaths();
  }

  async function createWallet(formData: FormData) {
    "use server";
    const { supabase, user } = await requireUser();
    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "").trim();

    if (!name || !type) throw new Error("Nama dan tipe dompet wajib diisi.");

    const { error } = await supabase.from("wallets").insert({
      user_id: user.id,
      name,
      type
    });
    if (error) throw new Error(error.message);
    await revalidateWalletRelatedPaths();
  }

  async function editWallet(formData: FormData) {
    "use server";
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "").trim();

    if (!id || !name || !type) throw new Error("ID, nama, dan tipe dompet wajib diisi.");

    const { error } = await supabase.from("wallets").update({
      name,
      type,
      updated_at: new Date().toISOString()
    }).eq("id", id).eq("user_id", user.id);
    
    if (error) throw new Error(error.message);
    await revalidateWalletRelatedPaths();
  }

  async function deleteWallet(formData: FormData) {
    "use server";
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") || "").trim();

    if (!id) throw new Error("ID dompet tidak valid.");

    const { error } = await supabase.from("wallets").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw new Error(error.message);
    await revalidateWalletRelatedPaths();
  }

  return (
    <AppShell
      className="journal-wallets"
      activeNav="wallets"
      month={selectedMonth}
      title="Manajemen Dompet"
      description="Kelola daftar rekening, dompet fisik, dan saldo tertahan Anda."
      headerActionsClassName="lg:flex-nowrap"
      headerActions={
        <>
          <MonthFilter selectedMonth={selectedMonth} compact className="min-w-[170px]" />
          <Link href="/transactions/new" className="btn-primary h-10 px-5">
            + Transaksi
          </Link>
        </>
      }
      mobileActions={
        <div className="flex w-full min-w-0 items-center gap-2">
          <MonthFilter selectedMonth={selectedMonth} compact className="flex-1" />
        </div>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <WalletManager
          wallets={walletsWithUsage}
          createAction={createWallet}
          editAction={editWallet}
          deleteAction={deleteWallet}
          adjustAction={adjustWalletBalance}
        />
      </div>
    </AppShell>
  );
}

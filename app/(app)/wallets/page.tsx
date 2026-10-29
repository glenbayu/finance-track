import Link from "next/link";
import { revalidatePath } from "next/cache";
import AppShell from "@/components/layout/app-shell";
import { requireUser } from "@/lib/supabase/auth";
import WalletManager from "@/components/wallets/wallet-manager";
import { isRolloverTransaction } from "@/lib/transactions/rollover";
import { getWalletTransactionDelta, getWalletTransactionDeltas } from "@/lib/transactions/wallet-balance";

async function revalidateWalletRelatedPaths() {
  revalidatePath("/wallets");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
  revalidatePath("/reports");
}

import MonthFilter from "@/components/ui/month-filter";
import { getCurrentDate, getCurrentMonth, getMonthRange } from "@/lib/utils/date";

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
    .select("id, name, type, created_at, is_rollover_enabled, admin_fee_amount")
    .eq("user_id", user.id)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat dompet: ${error.message}`);
  }

  // Get usage to prevent deleting used wallets and to display monthly transaction counts
  const walletIds = wallets.map(w => w.id);
  const allTimeUsageMap = new Map<string, number>();
  const monthlyCountMap = new Map<string, number>();
  const balanceMap = new Map<string, number>();
  
  if (walletIds.length > 0) {
    const { data: txData, error: transactionsError } = await supabase
      .from("transactions")
      .select("type, amount, wallet_id, destination_wallet_id, note, transaction_date")
      .eq("user_id", user.id);

    if (transactionsError) throw new Error("Saldo dompet belum dapat dimuat. Coba lagi setelah koneksi tersedia.");

    walletIds.forEach(id => {
      allTimeUsageMap.set(id, 0);
      monthlyCountMap.set(id, 0);
      balanceMap.set(id, 0);
    });
    
    txData?.forEach(tx => {
      const isRollover = isRolloverTransaction(tx.note);
      const isUpToMonth = tx.transaction_date < end;
      const isInMonth = tx.transaction_date >= start && tx.transaction_date < end;

      // All-time usage for delete guard
      if (tx.wallet_id) {
        allTimeUsageMap.set(tx.wallet_id, (allTimeUsageMap.get(tx.wallet_id) || 0) + 1);
      }
      if (tx.destination_wallet_id) {
        allTimeUsageMap.set(tx.destination_wallet_id, (allTimeUsageMap.get(tx.destination_wallet_id) || 0) + 1);
      }

      // Monthly transaction count for display
      if (isInMonth) {
        if (tx.wallet_id) {
          monthlyCountMap.set(tx.wallet_id, (monthlyCountMap.get(tx.wallet_id) || 0) + 1);
        }
        if (tx.destination_wallet_id) {
          monthlyCountMap.set(tx.destination_wallet_id, (monthlyCountMap.get(tx.destination_wallet_id) || 0) + 1);
        }
      }

      // Hitung saldo kumulatif riil tanpa rollover ganda.
      if (isUpToMonth && !isRollover) {
        for (const change of getWalletTransactionDeltas(tx)) {
          balanceMap.set(
            change.walletId,
            (balanceMap.get(change.walletId) || 0) + change.delta,
          );
        }
      }
    });
  }

  const walletsWithUsage = wallets.map(w => ({
    ...w,
    usageCount: allTimeUsageMap.get(w.id) || 0,
    monthlyCount: monthlyCountMap.get(w.id) || 0,
    balance: balanceMap.get(w.id) || 0
  }));

  async function adjustWalletBalance(formData: FormData) {
    "use server";
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") || "").trim();
    const rawBalance = String(formData.get("balance") ?? "").trim();
    const newBalance = Number(rawBalance);

    if (!id) throw new Error("ID dompet tidak valid.");
    if (!rawBalance || !Number.isFinite(newBalance)) {
      throw new Error("Saldo baru tidak valid.");
    }

    // Never trust a hidden current_balance field from the browser.
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError || !wallet) {
      throw new Error("Dompet tidak valid atau bukan milik user ini.");
    }

    // Recalculate from persisted transactions using the same rollover rule as the page.
    const { end } = getMonthRange(getCurrentMonth());
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("type, amount, wallet_id, destination_wallet_id, note")
      .eq("user_id", user.id)
      .lt("transaction_date", end);

    if (transactionsError) {
      throw new Error("Saldo dompet belum dapat dihitung. Coba lagi.");
    }

    const currentBalance = (transactions ?? [])
      .filter((transaction) => !isRolloverTransaction(transaction.note))
      .reduce(
        (balance, transaction) => balance + getWalletTransactionDelta(transaction, id),
        0,
      );

    const difference = newBalance - currentBalance;
    if (difference === 0) return;

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "adjustment",
      amount: difference,
      wallet_id: id,
      note: "Penyesuaian Saldo (Adjust Balance)",
      transaction_date: getCurrentDate(),
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
      type,
      is_rollover_enabled: formData.get("is_rollover_enabled") === "on",
      admin_fee_amount: Number(formData.get("admin_fee_amount") || 0)
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
      is_rollover_enabled: formData.get("is_rollover_enabled") === "on",
      admin_fee_amount: Number(formData.get("admin_fee_amount") || 0),
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
      className="bg-[var(--lk-bg)]"
      activeNav="wallets"
      month={selectedMonth}
      maxWidth="7xl"
      eyebrow="Saldo & Rekening"
      title="Dompet & Rekening"
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
      <WalletManager
        wallets={walletsWithUsage}
        isCurrentMonth={selectedMonth === getCurrentMonth()}
        createAction={createWallet}
        editAction={editWallet}
        deleteAction={deleteWallet}
        adjustAction={adjustWalletBalance}
      />
    </AppShell>
  );
}

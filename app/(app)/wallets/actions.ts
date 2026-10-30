"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { getCurrentDate, getCurrentMonth, getMonthRange } from "@/lib/utils/date";
import { isRolloverTransaction } from "@/lib/transactions/rollover";
import { getWalletTransactionDelta } from "@/lib/transactions/wallet-balance";

const WALLET_TYPES = new Set(["cash", "bank", "receivable"]);

function revalidateWalletRelatedPaths() {
  revalidatePath("/wallets");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
  revalidatePath("/reports");
}

function parseWalletType(value: FormDataEntryValue | null) {
  const type = String(value ?? "").trim();
  if (!WALLET_TYPES.has(type)) {
    throw new Error("Tipe dompet tidak valid.");
  }
  return type;
}

function parseAdminFeeAmount(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? "").trim();
  const amount = Number(rawValue || 0);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Nominal biaya admin tidak valid.");
  }
  return amount;
}

export async function adjustWalletBalance(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const rawBalance = String(formData.get("balance") ?? "").trim();
  const newBalance = Number(rawBalance);

  if (!id) throw new Error("ID dompet tidak valid.");
  if (!rawBalance || !Number.isFinite(newBalance)) {
    throw new Error("Saldo baru tidak valid.");
  }

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (walletError || !wallet) {
    throw new Error("Dompet tidak valid atau bukan milik user ini.");
  }

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

  if (error) throw new Error("Penyesuaian saldo gagal disimpan.");
  revalidateWalletRelatedPaths();
}

export async function createWallet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const type = parseWalletType(formData.get("type"));
  const adminFeeAmount = parseAdminFeeAmount(formData.get("admin_fee_amount"));

  if (!name) throw new Error("Nama dan tipe dompet wajib diisi.");

  const { error } = await supabase.from("wallets").insert({
    user_id: user.id,
    name,
    type,
    is_rollover_enabled: formData.get("is_rollover_enabled") === "on",
    admin_fee_amount: adminFeeAmount,
  });
  if (error) throw new Error("Dompet gagal disimpan.");
  revalidateWalletRelatedPaths();
}

export async function editWallet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = parseWalletType(formData.get("type"));
  const adminFeeAmount = parseAdminFeeAmount(formData.get("admin_fee_amount"));

  if (!id || !name) throw new Error("ID, nama, dan tipe dompet wajib diisi.");

  const { error } = await supabase.from("wallets").update({
    name,
    type,
    is_rollover_enabled: formData.get("is_rollover_enabled") === "on",
    admin_fee_amount: adminFeeAmount,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id);

  if (error) throw new Error("Dompet gagal diperbarui.");
  revalidateWalletRelatedPaths();
}

export async function deleteWallet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "").trim();

  if (!id) throw new Error("ID dompet tidak valid.");

  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error("Dompet gagal dihapus.");
  revalidateWalletRelatedPaths();
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { isDateValue } from "@/lib/utils/date";
import { forceRecalculateRollovers } from "@/lib/transactions/rollover";

const NOTE_MAX_LENGTH = 140;

function revalidateTransactionPaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
  revalidatePath("/wallets");
  revalidatePath("/reports");
  revalidatePath("/budgets");
}

function parseTransactionType(value: FormDataEntryValue | null) {
  if (value !== "income" && value !== "expense" && value !== "transfer") {
    throw new Error("Tipe transaksi tidak valid.");
  }
  return value;
}

function parseTransactionFields(formData: FormData) {
  const type = parseTransactionType(formData.get("type"));
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const destinationWalletId = String(formData.get("destination_wallet_id") ?? "").trim();
  const rawNote = String(formData.get("note") || "").trim();
  const note = rawNote ? rawNote.slice(0, NOTE_MAX_LENGTH) : null;
  const transactionDate = String(formData.get("transaction_date") ?? "").trim();

  if (!transactionDate || !walletId) {
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

  return { type, amount, categoryId, walletId, destinationWalletId, note, transactionDate };
}

async function validateTransactionReferences(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  fields: ReturnType<typeof parseTransactionFields>,
) {
  let validCategoryId: string | null = fields.categoryId;

  if (fields.type !== "transfer") {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", fields.categoryId)
      .eq("type", fields.type)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .is("archived_at", null)
      .single();

    if (categoryError || !category) {
      throw new Error("Kategori tidak valid.");
    }
    validCategoryId = category.id;
  } else {
    validCategoryId = null;
  }

  const walletIds = fields.type === "transfer"
    ? [fields.walletId, fields.destinationWalletId]
    : [fields.walletId];
  const { data: ownedWallets, error: walletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .in("id", walletIds);

  if (walletError || (ownedWallets?.length ?? 0) !== walletIds.length) {
    throw new Error("Dompet tidak valid atau bukan milik user ini.");
  }

  return { validCategoryId };
}

export async function createTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fields = parseTransactionFields(formData);
  const { validCategoryId } = await validateTransactionReferences(supabase, user.id, fields);

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: fields.type,
      amount: fields.amount,
      category_id: validCategoryId,
      wallet_id: fields.walletId,
      destination_wallet_id: fields.type === "transfer" ? fields.destinationWalletId : null,
      note: fields.note,
      transaction_date: fields.transactionDate,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error("Transaksi gagal tersimpan.");
  }

  revalidateTransactionPaths();
  redirect("/transactions?toast=transaction_created");
}

export async function updateTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const rawType = formData.get("type");

  if (!id) throw new Error("ID transaksi tidak valid.");
  if (rawType !== "income" && rawType !== "expense" && rawType !== "transfer" && rawType !== "adjustment") {
    throw new Error("Tipe transaksi tidak valid.");
  }

  const type = rawType;
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const destinationWalletId = String(formData.get("destination_wallet_id") ?? "").trim();
  const rawNote = String(formData.get("note") || "").trim();
  const note = rawNote ? rawNote.slice(0, NOTE_MAX_LENGTH) : null;
  const transactionDate = String(formData.get("transaction_date") ?? "").trim();

  if (!transactionDate || !walletId) {
    throw new Error("Data transaksi belum lengkap.");
  }

  if (type !== "transfer" && type !== "adjustment" && !categoryId) {
    throw new Error("Kategori harus dipilih.");
  }

  if (type === "transfer" && (!destinationWalletId || walletId === destinationWalletId)) {
    throw new Error("Dompet tujuan tidak valid.");
  }

  if (!Number.isFinite(amount) || (type === "adjustment" ? amount === 0 : amount <= 0)) {
    throw new Error(
      type === "adjustment"
        ? "Nominal koreksi saldo tidak boleh 0."
        : "Jumlah transaksi harus lebih dari 0.",
    );
  }

  if (!isDateValue(transactionDate)) {
    throw new Error("Tanggal transaksi tidak valid.");
  }

  let validCategoryId: string | null = categoryId;
  if (type !== "transfer" && type !== "adjustment") {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("type", type)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .single();

    if (categoryError || !category) {
      throw new Error("Kategori tidak valid.");
    }
    validCategoryId = category.id;
  } else {
    validCategoryId = null;
  }

  const walletIds = type === "transfer" ? [walletId, destinationWalletId] : [walletId];
  const { data: ownedWallets, error: walletError } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .in("id", walletIds);

  if (walletError || (ownedWallets?.length ?? 0) !== walletIds.length) {
    throw new Error("Dompet tidak valid atau bukan milik user ini.");
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      type,
      amount,
      category_id: validCategoryId,
      wallet_id: walletId,
      destination_wallet_id: type === "transfer" ? destinationWalletId : null,
      note,
      transaction_date: transactionDate,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error("Transaksi gagal diperbarui.");

  revalidateTransactionPaths();
  redirect("/transactions?toast=transaction_updated");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID transaksi tidak valid.");

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error("Transaksi gagal dihapus.");
  revalidateTransactionPaths();
}

export async function deleteTransactionAndRedirect(formData: FormData) {
  await deleteTransaction(formData);
  redirect("/transactions?toast=transaction_deleted");
}

export async function runMonthlyRollover() {
  const { supabase, user } = await requireUser();
  await forceRecalculateRollovers(supabase, user.id);
  revalidateTransactionPaths();
}

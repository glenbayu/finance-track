import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentMonth, pad2 } from "./utils/date";

function getLastDayOfMonth(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 0));
  const dayNum = date.getUTCDate();
  return `${year}-${pad2(month)}-${pad2(dayNum)}`;
}

/**
 * Menghitung rollover saldo bulan lalu dan membuat admin fee + rollover
 * untuk bulan berjalan. Fungsi ini idempoten — aman dipanggil berkali-kali.
 *
 * Alur:
 * 1. Buat transaksi Biaya Admin Rekening Rp 6.000 di akhir bulan lalu (untuk wallet bank)
 * 2. Hitung sisa saldo bulan lalu (semua income - semua expense, termasuk admin fee)
 * 3. Buat transaksi rollover di tanggal 1 bulan ini
 */
export async function forceRecalculateRollovers(supabase: SupabaseClient, userId: string) {
  const currentMonth = getCurrentMonth();
  const currentMonthDateStr = `${currentMonth}-01`;

  // Hitung bulan sebelumnya
  const [year, monthNum] = currentMonth.split("-").map(Number);
  const prevYear = monthNum === 1 ? year - 1 : year;
  const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
  const previousMonth = `${prevYear}-${pad2(prevMonthNum)}`;
  const previousMonthStart = `${previousMonth}-01`;
  const lastDayOfPreviousMonth = getLastDayOfMonth(previousMonth);

  // 1. Ambil semua wallet user
  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, name, type")
    .eq("user_id", userId);

  if (!wallets || wallets.length === 0) return;

  // 2. Ambil semua kategori
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (!categories) return;

  const bonusCategory = categories.find(
    (c) => c.type === "income" && c.name.toLowerCase() === "bonus"
  );
  const rolloverIncomeCategoryId = bonusCategory?.id || null;

  const defisitCategory = categories.find(
    (c) =>
      c.type === "expense" &&
      c.name.toLowerCase().includes("defisit")
  );
  const rolloverExpenseCategoryId = defisitCategory?.id || null;

  const adminCategory = categories.find(
    (c) =>
      c.type === "expense" &&
      (c.name.toLowerCase().includes("tagihan") ||
        c.name.toLowerCase().includes("langganan"))
  );
  const adminCategoryId = adminCategory?.id || null;

  // --- STAGE 1: BUAT BIAYA ADMIN REKENING DI AKHIR BULAN LALU ---
  // Pertama, cek apakah admin fee sudah ada
  const { data: existingAdminFees } = await supabase
    .from("transactions")
    .select("id, wallet_id")
    .eq("user_id", userId)
    .eq("transaction_date", lastDayOfPreviousMonth)
    .eq("note", "Biaya Admin Rekening")
    .eq("type", "expense");

  const existingAdminWalletIds = new Set(
    (existingAdminFees ?? []).map((tx) => tx.wallet_id)
  );

  for (const wallet of wallets) {
    if (wallet.type === "bank" && !existingAdminWalletIds.has(wallet.id)) {
      await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "expense",
          amount: 6000,
          wallet_id: wallet.id,
          note: "Biaya Admin Rekening",
          transaction_date: lastDayOfPreviousMonth,
          category_id: adminCategoryId,
        });
    }
  }

  // --- STAGE 2: QUERY ULANG TRANSAKSI BULAN LALU (TERMASUK ADMIN FEE BARU) ---
  // Pakai range query (gte/lt) yang aman untuk kolom DATE, bukan .like()
  const { data: prevMonthTxs } = await supabase
    .from("transactions")
    .select("id, type, amount, note, transaction_date, wallet_id, destination_wallet_id, category_id")
    .eq("user_id", userId)
    .gte("transaction_date", previousMonthStart)
    .lte("transaction_date", lastDayOfPreviousMonth);

  // Query rollover yang sudah ada di tanggal 1 bulan ini
  const { data: existingRollovers } = await supabase
    .from("transactions")
    .select("id, type, amount, note, wallet_id, category_id")
    .eq("user_id", userId)
    .eq("transaction_date", currentMonthDateStr)
    .in("note", ["Sisa uang bulan kemarin (Rollover)", "Defisit uang bulan kemarin (Rollover)"]);

  const prevTxs = prevMonthTxs ?? [];
  const rollovers = existingRollovers ?? [];

  // --- STAGE 3: HITUNG SALDO & BUAT ROLLOVER PER WALLET ---
  for (const wallet of wallets) {
    let balance = 0;

    for (const tx of prevTxs) {
      const amt = Number(tx.amount);

      if (tx.type === "transfer") {
        // Transfer: kurangi dari wallet asal, tambah ke wallet tujuan
        if (tx.wallet_id === wallet.id) balance -= amt;
        if (tx.destination_wallet_id === wallet.id) balance += amt;
      } else if (tx.wallet_id === wallet.id) {
        // Income, expense, adjustment — hanya untuk wallet ini
        if (tx.type === "income") {
          balance += amt;
        } else if (tx.type === "expense") {
          balance -= amt;
        } else if (tx.type === "adjustment") {
          balance += amt;
        }
      }
    }

    // Cari rollover existing untuk wallet ini
    const existingRollover = rollovers.find(
      (tx) => tx.wallet_id === wallet.id
    );

    const expectedType = balance > 0 ? "income" : "expense";
    const expectedAmount = Math.abs(balance);
    const expectedNote =
      balance > 0
        ? "Sisa uang bulan kemarin (Rollover)"
        : "Defisit uang bulan kemarin (Rollover)";
    const expectedCategoryId = balance > 0 ? rolloverIncomeCategoryId : rolloverExpenseCategoryId;

    if (balance !== 0) {
      if (!existingRollover) {
        // Buat rollover baru
        await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            type: expectedType,
            amount: expectedAmount,
            wallet_id: wallet.id,
            note: expectedNote,
            transaction_date: currentMonthDateStr,
            category_id: expectedCategoryId,
          });
      } else {
        // Update rollover jika nominalnya berubah
        if (
          existingRollover.type !== expectedType ||
          Number(existingRollover.amount) !== expectedAmount ||
          existingRollover.category_id !== expectedCategoryId
        ) {
          await supabase
            .from("transactions")
            .update({
              type: expectedType,
              amount: expectedAmount,
              note: expectedNote,
              category_id: expectedCategoryId,
            })
            .eq("id", existingRollover.id);
        }
      }
    } else {
      // Saldo 0 → hapus rollover jika ada
      if (existingRollover) {
        await supabase
          .from("transactions")
          .delete()
          .eq("id", existingRollover.id);
      }
    }
  }
}

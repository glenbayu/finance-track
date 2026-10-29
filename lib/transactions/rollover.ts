import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentMonth, pad2 } from "@/lib/utils/date";

export const ROLLOVER_NOTES = [
  "Sisa uang bulan kemarin (Rollover)",
  "Defisit uang bulan kemarin (Rollover)",
] as const;

export function isRolloverTransaction(note: string | null | undefined): boolean {
  if (!note) return false;
  return (
    note.includes("(Rollover)") ||
    note === "Sisa uang bulan kemarin (Rollover)" ||
    note === "Defisit uang bulan kemarin (Rollover)"
  );
}

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
  const { data: wallets, error: walletsError } = await supabase
    .from("wallets")
    .select("id, name, type, is_rollover_enabled, admin_fee_amount, created_at")
    .eq("user_id", userId);

  if (walletsError) {
    throw new Error(`Gagal memuat dompet untuk rollover: ${walletsError.message}`);
  }
  if (!wallets || wallets.length === 0) return;

  // 2. Ambil semua kategori
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (categoriesError) {
    throw new Error(`Gagal memuat kategori untuk rollover: ${categoriesError.message}`);
  }
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
  const { data: existingAdminFees, error: existingAdminFeesError } = await supabase
    .from("transactions")
    .select("id, wallet_id")
    .eq("user_id", userId)
    .eq("transaction_date", lastDayOfPreviousMonth)
    .eq("note", "Biaya Admin Rekening")
    .eq("type", "expense");

  if (existingAdminFeesError) {
    throw new Error(`Gagal memeriksa biaya admin: ${existingAdminFeesError.message}`);
  }

  const existingAdminWalletIds = new Set(
    (existingAdminFees ?? []).map((tx) => tx.wallet_id)
  );

  const currentMonthStart = `${currentMonth}-01T00:00:00.000Z`;

  for (const wallet of wallets) {
    // Lewati dompet yang baru dibuat bulan ini
    if (new Date(wallet.created_at) >= new Date(currentMonthStart)) continue;

    if (wallet.is_rollover_enabled && Number(wallet.admin_fee_amount) > 0 && !existingAdminWalletIds.has(wallet.id)) {
      const { error: adminFeeInsertError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "expense",
          amount: Number(wallet.admin_fee_amount),
          wallet_id: wallet.id,
          note: "Biaya Admin Rekening",
          transaction_date: lastDayOfPreviousMonth,
          category_id: adminCategoryId,
        });

      if (adminFeeInsertError) {
        throw new Error(`Gagal menyimpan biaya admin: ${adminFeeInsertError.message}`);
      }
    }
  }

  // --- STAGE 2: QUERY ULANG TRANSAKSI BULAN LALU (TERMASUK ADMIN FEE BARU) ---
  // Pakai range query (gte/lt) yang aman untuk kolom DATE, bukan .like()
  const { data: prevMonthTxs, error: prevMonthTxsError } = await supabase
    .from("transactions")
    .select("id, type, amount, note, transaction_date, wallet_id, destination_wallet_id, category_id")
    .eq("user_id", userId)
    .gte("transaction_date", previousMonthStart)
    .lte("transaction_date", lastDayOfPreviousMonth);

  if (prevMonthTxsError) {
    throw new Error(`Gagal memuat transaksi bulan sebelumnya: ${prevMonthTxsError.message}`);
  }

  // Query rollover yang sudah ada di tanggal 1 bulan ini
  const { data: existingRollovers, error: existingRolloversError } = await supabase
    .from("transactions")
    .select("id, type, amount, note, wallet_id, category_id")
    .eq("user_id", userId)
    .eq("transaction_date", currentMonthDateStr)
    .in("note", ["Sisa uang bulan kemarin (Rollover)", "Defisit uang bulan kemarin (Rollover)"]);

  if (existingRolloversError) {
    throw new Error(`Gagal memeriksa rollover yang sudah ada: ${existingRolloversError.message}`);
  }

  const prevTxs = prevMonthTxs ?? [];
  const rollovers = existingRollovers ?? [];

  // --- STAGE 3: HITUNG SALDO & BUAT ROLLOVER PER WALLET ---
  for (const wallet of wallets) {
    // Lewati dompet yang baru dibuat bulan ini
    if (new Date(wallet.created_at) >= new Date(currentMonthStart)) continue;

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

    // Jika rollover tidak aktif pada wallet ini, hapus rollover yang ada lalu lewati
    if (!wallet.is_rollover_enabled) {
      if (existingRollover) {
        const { error: rolloverDeleteError } = await supabase
          .from("transactions")
          .delete()
          .eq("id", existingRollover.id);

        if (rolloverDeleteError) {
          throw new Error(`Gagal menghapus rollover lama: ${rolloverDeleteError.message}`);
        }
      }
      continue;
    }

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
        const { error: rolloverInsertError } = await supabase
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

        if (rolloverInsertError) {
          throw new Error(`Gagal membuat rollover baru: ${rolloverInsertError.message}`);
        }
      } else {
        // Update rollover jika nominalnya berubah
        if (
          existingRollover.type !== expectedType ||
          Number(existingRollover.amount) !== expectedAmount ||
          existingRollover.category_id !== expectedCategoryId
        ) {
          const { error: rolloverUpdateError } = await supabase
            .from("transactions")
            .update({
              type: expectedType,
              amount: expectedAmount,
              note: expectedNote,
              category_id: expectedCategoryId,
            })
            .eq("id", existingRollover.id);

          if (rolloverUpdateError) {
            throw new Error(`Gagal memperbarui rollover: ${rolloverUpdateError.message}`);
          }
        }
      }
    } else {
      // Saldo 0 → hapus rollover jika ada
      if (existingRollover) {
        const { error: rolloverDeleteError } = await supabase
          .from("transactions")
          .delete()
          .eq("id", existingRollover.id);

        if (rolloverDeleteError) {
          throw new Error(`Gagal menghapus rollover lama: ${rolloverDeleteError.message}`);
        }
      }
    }
  }
}

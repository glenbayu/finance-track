import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentMonth, pad2 } from "./date";

function getNextMonth(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const nextYear = monthNum === 12 ? year + 1 : year;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  return `${nextYear}-${pad2(nextMonth)}`;
}

function getLastDayOfMonth(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  // Month index in Date constructor is 0-based, so passing month (which is monthNum) and day 0 
  // returns the last day of the desired month.
  const date = new Date(Date.UTC(year, month, 0));
  const dayNum = date.getUTCDate();
  return `${year}-${pad2(month)}-${pad2(dayNum)}`;
}

export async function syncRolloversAndAdminFees(supabase: SupabaseClient, userId: string) {
  // 1. Bersihkan semua transaksi rollover otomatis lama
  await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .in("note", ["Sisa uang bulan kemarin (Rollover)", "Defisit uang bulan kemarin (Rollover)"]);

  // 2. Bersihkan biaya admin otomatis yang tanggalnya sebelum akhir Juli 2026 (yaitu < 2026-07-31)
  await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("note", "Biaya Admin Rekening")
    .lt("transaction_date", "2026-07-31");

  // 3. Bersihkan duplikat biaya admin rekening mulai akhir Juli 2026 (jika ada karena race condition)
  const { data: tempAdminFees } = await supabase
    .from("transactions")
    .select("id, wallet_id, transaction_date")
    .eq("user_id", userId)
    .eq("note", "Biaya Admin Rekening")
    .gte("transaction_date", "2026-07-31");

  if (tempAdminFees && tempAdminFees.length > 0) {
    const adminGroups = new Map<string, string[]>();
    tempAdminFees.forEach((tx) => {
      if (tx.wallet_id && tx.transaction_date) {
        const key = `${tx.wallet_id}:${tx.transaction_date}`;
        const list = adminGroups.get(key) || [];
        list.push(tx.id);
        adminGroups.set(key, list);
      }
    });

    const adminIdsToDelete: string[] = [];
    for (const ids of adminGroups.values()) {
      if (ids.length > 1) {
        adminIdsToDelete.push(...ids.slice(1));
      }
    }

    if (adminIdsToDelete.length > 0) {
      await supabase.from("transactions").delete().in("id", adminIdsToDelete);
    }
  }

  // 4. Ambil semua dompet milik user
  const { data: wallets, error: walletsError } = await supabase
    .from("wallets")
    .select("id, name, type")
    .eq("user_id", userId);

  if (walletsError || !wallets || wallets.length === 0) return;

  // 5. Ambil semua kategori milik user
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (catError || !categories) return;

  // Cari kategori "Bonus" untuk Pemasukan Rollover
  const bonusCategory = categories.find(
    (c) => c.type === "income" && c.name.toLowerCase() === "bonus"
  );
  const rolloverIncomeCategoryId = bonusCategory?.id || null;

  // Cari kategori "Lainnya" untuk Pengeluaran Rollover (jika defisit)
  const otherCategory = categories.find(
    (c) =>
      c.type === "expense" &&
      (c.name.toLowerCase().includes("lain") || c.name.toLowerCase() === "others")
  );
  const rolloverExpenseCategoryId = otherCategory?.id || null;

  // Kategori biaya admin (cari yang paling cocok)
  const adminCategory = categories.find(
    (c) =>
      c.type === "expense" &&
      (c.name.toLowerCase().includes("tagihan") ||
        c.name.toLowerCase().includes("langganan") ||
        c.name.toLowerCase().includes("biaya") ||
        c.name.toLowerCase().includes("admin"))
  );
  const adminCategoryId = adminCategory?.id || null;

  // 6. Ambil semua transaksi milik user dari awal waktu (setelah pembersihan)
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("id, type, amount, note, transaction_date, wallet_id, destination_wallet_id, category_id")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: true });

  if (txError || !transactions || transactions.length === 0) return;

  const firstTxDate = transactions[0].transaction_date;
  if (!firstTxDate) return;

  const dbStartMonth = firstTxDate.slice(0, 7);
  // Mulai otomatisasi dari Juli 2026 (sehingga rollover pertama terbentuk 1 Agustus 2026)
  const startMonth = dbStartMonth > "2026-07" ? dbStartMonth : "2026-07";
  const currentMonth = getCurrentMonth();

  if (startMonth >= currentMonth) return;

  let localTxs = [...transactions];

  let month = startMonth;
  while (month < currentMonth) {
    const nextMonth = getNextMonth(month);
    const lastDayOfCurrentMonth = getLastDayOfMonth(month);

    // --- TAHAP 1: AUTO-GENERATE BIAYA ADMIN REKENING ---
    // Aturan ini mulai berlaku hanya untuk bulan Juli 2026 dan setelahnya
    if (month >= "2026-07") {
      for (const wallet of wallets) {
        if (wallet.type === "bank") {
          const existingAdminFee = localTxs.find(
            (tx) =>
              tx.wallet_id === wallet.id &&
              tx.transaction_date === lastDayOfCurrentMonth &&
              tx.note === "Biaya Admin Rekening" &&
              tx.type === "expense"
          );

          if (!existingAdminFee) {
            const { data: newAdminTx, error: adminError } = await supabase
              .from("transactions")
              .insert({
                user_id: userId,
                type: "expense",
                amount: 6000,
                wallet_id: wallet.id,
                note: "Biaya Admin Rekening",
                transaction_date: lastDayOfCurrentMonth,
                category_id: adminCategoryId,
              })
              .select("id, type, amount, note, transaction_date, wallet_id, destination_wallet_id, category_id")
              .single();

            if (!adminError && newAdminTx) {
              localTxs.push(newAdminTx);
            }
          }
        }
      }
    }

    // --- TAHAP 2: HITUNG & SINKRONISASI ROLLOVER SALDO ---
    for (const wallet of wallets) {
      let balance = 0;
      let existingRollover: any = null;

      // Hitung saldo running untuk dompet ini:
      // Hanya jumlahkan transaksi strictly di bulan berjalan saja (=== month) 
      // dan abaikan transaksi rollover otomatis agar tidak terjadi akumulasi berlipat.
      for (const tx of localTxs) {
        const txMonth = tx.transaction_date.slice(0, 7);

        if (
          txMonth === month &&
          tx.note !== "Sisa uang bulan kemarin (Rollover)" &&
          tx.note !== "Defisit uang bulan kemarin (Rollover)"
        ) {
          const amt = Number(tx.amount);
          if (tx.type === "income" && tx.wallet_id === wallet.id) {
            balance += amt;
          } else if (tx.type === "expense" && tx.wallet_id === wallet.id) {
            balance -= amt;
          } else if (tx.type === "adjustment" && tx.wallet_id === wallet.id) {
            balance += amt;
          } else if (tx.type === "transfer") {
            if (tx.wallet_id === wallet.id) balance -= amt;
            if (tx.destination_wallet_id === wallet.id) balance += amt;
          }
        }

        // Cari rollover di bulan berikutnya (yang berada di tanggal 1 bulan berikutnya)
        if (
          txMonth === nextMonth &&
          tx.wallet_id === wallet.id &&
          tx.transaction_date === `${nextMonth}-01` &&
          (tx.note === "Sisa uang bulan kemarin (Rollover)" ||
            tx.note === "Defisit uang bulan kemarin (Rollover)")
        ) {
          existingRollover = tx;
        }
      }

      const expectedType = balance > 0 ? "income" : "expense";
      const expectedAmount = Math.abs(balance);
      const expectedNote =
        balance > 0
          ? "Sisa uang bulan kemarin (Rollover)"
          : "Defisit uang bulan kemarin (Rollover)";
      const expectedDate = `${nextMonth}-01`;
      const expectedCategoryId = balance > 0 ? rolloverIncomeCategoryId : rolloverExpenseCategoryId;

      if (balance !== 0) {
        if (!existingRollover) {
          // INSERT rollover baru
          const { data: newRolloverTx, error: rollError } = await supabase
            .from("transactions")
            .insert({
              user_id: userId,
              type: expectedType,
              amount: expectedAmount,
              wallet_id: wallet.id,
              note: expectedNote,
              transaction_date: expectedDate,
              category_id: expectedCategoryId,
            })
            .select("id, type, amount, note, transaction_date, wallet_id, destination_wallet_id, category_id")
            .single();

          if (!rollError && newRolloverTx) {
            localTxs.push(newRolloverTx);
          }
        } else {
          // UPDATE jika data nominal, tipe, atau kategori tidak sesuai
          if (
            existingRollover.type !== expectedType ||
            Number(existingRollover.amount) !== expectedAmount ||
            existingRollover.category_id !== expectedCategoryId
          ) {
            const { data: updatedRolloverTx, error: updateError } = await supabase
              .from("transactions")
              .update({
                type: expectedType,
                amount: expectedAmount,
                note: expectedNote,
                category_id: expectedCategoryId,
              })
              .eq("id", existingRollover.id)
              .select("id, type, amount, note, transaction_date, wallet_id, destination_wallet_id, category_id")
              .single();

            if (!updateError && updatedRolloverTx) {
              localTxs = localTxs.map((t) => (t.id === updatedRolloverTx.id ? updatedRolloverTx : t));
            }
          }
        }
      } else {
        // Jika saldo akhir 0, pastikan tidak ada rollover (hapus jika ada)
        if (existingRollover) {
          const { error: deleteError } = await supabase
            .from("transactions")
            .delete()
            .eq("id", existingRollover.id);

          if (!deleteError) {
            localTxs = localTxs.filter((t) => t.id !== existingRollover.id);
          }
        }
      }
    }

    month = nextMonth;
  }
}

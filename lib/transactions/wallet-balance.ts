export type WalletBalanceTransaction = {
  type: string;
  amount: number | string;
  wallet_id: string | null;
  destination_wallet_id: string | null;
};

export type WalletBalanceDelta = {
  walletId: string;
  delta: number;
};

/**
 * Returns the signed balance changes a transaction applies to its wallets.
 * Adjustment amounts are already signed: a negative adjustment reduces balance.
 */
export function getWalletTransactionDeltas(
  transaction: WalletBalanceTransaction,
): WalletBalanceDelta[] {
  const amount = Number(transaction.amount);
  if (!Number.isFinite(amount)) {
    throw new Error("Nominal transaksi tidak valid untuk perhitungan saldo.");
  }

  if (transaction.type === "transfer") {
    const changes: WalletBalanceDelta[] = [];
    if (transaction.wallet_id) {
      changes.push({ walletId: transaction.wallet_id, delta: -amount });
    }
    if (transaction.destination_wallet_id) {
      changes.push({ walletId: transaction.destination_wallet_id, delta: amount });
    }
    return changes;
  }

  if (!transaction.wallet_id) return [];

  switch (transaction.type) {
    case "income":
      return [{ walletId: transaction.wallet_id, delta: amount }];
    case "expense":
      return [{ walletId: transaction.wallet_id, delta: -amount }];
    case "adjustment":
      return [{ walletId: transaction.wallet_id, delta: amount }];
    default:
      return [];
  }
}

export function getWalletTransactionDelta(
  transaction: WalletBalanceTransaction,
  walletId: string,
): number {
  return getWalletTransactionDeltas(transaction)
    .filter((change) => change.walletId === walletId)
    .reduce((total, change) => total + change.delta, 0);
}

export function calculateWalletBalance(
  transactions: WalletBalanceTransaction[],
  walletId: string,
): number {
  return transactions.reduce(
    (balance, transaction) => balance + getWalletTransactionDelta(transaction, walletId),
    0,
  );
}

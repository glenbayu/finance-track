import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateWalletBalance,
  getWalletTransactionDelta,
  getWalletTransactionDeltas,
} from "../lib/transactions/wallet-balance.ts";

test("calculates wallet balances across income, expense, signed adjustments, and transfers", () => {
  const transactions = [
    { type: "income", amount: 100_000, wallet_id: "cash", destination_wallet_id: null },
    { type: "expense", amount: 25_000, wallet_id: "cash", destination_wallet_id: null },
    { type: "adjustment", amount: -12_000, wallet_id: "cash", destination_wallet_id: null },
    { type: "adjustment", amount: 7_000, wallet_id: "cash", destination_wallet_id: null },
    { type: "transfer", amount: 30_000, wallet_id: "cash", destination_wallet_id: "bank" },
    { type: "income", amount: 5_000, wallet_id: "bank", destination_wallet_id: null },
  ];

  assert.equal(calculateWalletBalance(transactions, "cash"), 40_000);
  assert.equal(calculateWalletBalance(transactions, "bank"), 35_000);
});

test("returns both sides of a transfer and signed adjustment deltas", () => {
  assert.deepEqual(
    getWalletTransactionDeltas({
      type: "transfer",
      amount: "12.50",
      wallet_id: "cash",
      destination_wallet_id: "bank",
    }),
    [
      { walletId: "cash", delta: -12.5 },
      { walletId: "bank", delta: 12.5 },
    ],
  );

  assert.equal(
    getWalletTransactionDelta({
      type: "adjustment",
      amount: -500,
      wallet_id: "cash",
      destination_wallet_id: null,
    }, "cash"),
    -500,
  );
});

test("ignores transactions that do not change a wallet and rejects invalid amounts", () => {
  assert.equal(
    getWalletTransactionDelta({
      type: "expense",
      amount: 100,
      wallet_id: "cash",
      destination_wallet_id: null,
    }, "bank"),
    0,
  );
  assert.throws(() => getWalletTransactionDeltas({
    type: "income",
    amount: "NaN",
    wallet_id: "cash",
    destination_wallet_id: null,
  }), /Nominal transaksi tidak valid/);
});

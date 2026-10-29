import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTransactionDate } from "../lib/transactions/quick-add-validation.ts";

test("uses the supplied valid calendar date", () => {
  assert.equal(normalizeTransactionDate("2024-02-29"), "2024-02-29");
  assert.equal(normalizeTransactionDate(" 2026-10-29 "), "2026-10-29");
});

test("rejects invalid non-empty dates instead of silently using today", () => {
  assert.equal(normalizeTransactionDate("2026-02-30"), null);
  assert.equal(normalizeTransactionDate("2026-02-29"), null);
  assert.equal(normalizeTransactionDate("2026-13-01"), null);
  assert.equal(normalizeTransactionDate("not-a-date"), null);
});

test("uses today's business date when the input is omitted or blank", () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  assert.equal(normalizeTransactionDate(), today);
  assert.equal(normalizeTransactionDate("  "), today);
});

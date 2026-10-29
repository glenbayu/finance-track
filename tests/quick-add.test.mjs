import test from "node:test";
import assert from "node:assert/strict";
import { createTransactionFromTemplateForUser } from "../lib/transactions/quick-add-action-core.ts";
import { isCompatibleQuickAddCategory } from "../lib/transactions/quick-add.ts";
import { getCurrentDate } from "../lib/utils/date.ts";

const USER = { id: "user-a" };
const DEFAULT_TEMPLATE = {
  type: "expense",
  category_id: "category-a",
  amount: 12500,
  note: "Lunch",
  is_active: true,
  use_count: 0,
};

function createSupabaseMock({
  template = DEFAULT_TEMPLATE,
  templateError = null,
  category = { type: "expense" },
  categoryError = null,
  wallet = { id: "wallet-a" },
  walletError = null,
  inserted = { id: "transaction-a" },
  insertError = null,
} = {}) {
  const calls = [];
  const results = { templateError, categoryError, walletError, insertError };

  function builder(table) {
    const query = {
      select(...columns) {
        calls.push({ table, operation: "select", columns });
        return query;
      },
      eq(column, value) {
        calls.push({ table, operation: "eq", column, value });
        return query;
      },
      or(expression) {
        calls.push({ table, operation: "or", expression });
        return query;
      },
      is(column, value) {
        calls.push({ table, operation: "is", column, value });
        return query;
      },
      order(column, options) {
        calls.push({ table, operation: "order", column, options });
        return query;
      },
      limit(count) {
        calls.push({ table, operation: "limit", count });
        return query;
      },
      insert(values) {
        calls.push({ table, operation: "insert", values });
        return query;
      },
      update(values) {
        calls.push({ table, operation: "update", values });
        return query;
      },
      async maybeSingle() {
        calls.push({ table, operation: "maybeSingle" });
        if (table === "quick_add_templates") {
          return { data: template, error: results.templateError };
        }
        return { data: category, error: results.categoryError };
      },
      async single() {
        calls.push({ table, operation: "single" });
        if (table === "wallets") return { data: wallet, error: results.walletError };
        return { data: inserted, error: results.insertError };
      },
    };
    return query;
  }

  return {
    calls,
    from(table) {
      calls.push({ table, operation: "from" });
      return builder(table);
    },
  };
}

function callsFor(calls, table, operation) {
  return calls.filter((call) => call.table === table && call.operation === operation);
}

test("accepts a valid leap-day date and inserts it unchanged", async () => {
  const supabase = createSupabaseMock();
  const result = await createTransactionFromTemplateForUser(supabase, USER, {
    templateId: "template-a",
    transactionDate: "2024-02-29",
  });

  assert.deepEqual(result, { ok: true, transactionId: "transaction-a" });
  assert.equal(callsFor(supabase.calls, "transactions", "insert")[0].values.transaction_date, "2024-02-29");
  assert.equal(
    callsFor(supabase.calls, "quick_add_templates", "eq").some(
      (call) => call.column === "user_id" && call.value === USER.id,
    ),
    true,
  );
});

test("defaults an omitted date to the application business date", async () => {
  const supabase = createSupabaseMock();
  const result = await createTransactionFromTemplateForUser(supabase, USER, {
    templateId: "template-a",
  });

  assert.equal(result.ok, true);
  assert.equal(
    callsFor(supabase.calls, "transactions", "insert")[0].values.transaction_date,
    getCurrentDate(),
  );
});

test("rejects impossible or unsupported dates before any database query", async () => {
  for (const transactionDate of ["2025-02-29", "2026-02-31", "29-02-2024"]) {
    const supabase = createSupabaseMock();
    const result = await createTransactionFromTemplateForUser(supabase, USER, {
      templateId: "template-a",
      transactionDate,
    });

    assert.deepEqual(result, { ok: false, error: "Tanggal transaksi tidak valid." });
    assert.equal(supabase.calls.length, 0);
  }
});

test("rejects a missing category without querying the wallet or inserting", async () => {
  const supabase = createSupabaseMock({ category: null });
  const result = await createTransactionFromTemplateForUser(supabase, USER, {
    templateId: "template-a",
    transactionDate: "2026-10-29",
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /Kategori template tidak valid/);
  assert.equal(callsFor(supabase.calls, "wallets", "single").length, 0);
  assert.equal(callsFor(supabase.calls, "transactions", "insert").length, 0);
});

test("rejects an archived category without querying the wallet or inserting", async () => {
  const supabase = createSupabaseMock({ category: null });
  const result = await createTransactionFromTemplateForUser(supabase, USER, {
    templateId: "template-a",
    transactionDate: "2026-10-29",
  });

  assert.equal(result.ok, false);
  assert.equal(callsFor(supabase.calls, "categories", "is")[0].value, null);
  assert.equal(callsFor(supabase.calls, "transactions", "insert").length, 0);
});

test("rejects a mismatched category type without inserting", async () => {
  const supabase = createSupabaseMock({ category: { type: "income" } });
  const result = await createTransactionFromTemplateForUser(supabase, USER, {
    templateId: "template-a",
    transactionDate: "2026-10-29",
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /Kategori template tidak valid/);
  assert.equal(callsFor(supabase.calls, "transactions", "insert").length, 0);
});

test("allows a template without a category and preserves the null reference", async () => {
  const supabase = createSupabaseMock({
    template: { ...DEFAULT_TEMPLATE, category_id: null },
  });
  const result = await createTransactionFromTemplateForUser(supabase, USER, {
    templateId: "template-a",
    transactionDate: "2026-10-29",
  });

  assert.equal(result.ok, true);
  assert.equal(callsFor(supabase.calls, "categories", "maybeSingle").length, 0);
  assert.equal(callsFor(supabase.calls, "transactions", "insert")[0].values.category_id, null);
});

test("returns database errors without reporting success or inserting", async () => {
  const templateErrorClient = createSupabaseMock({ templateError: { message: "template read failed" } });
  const templateResult = await createTransactionFromTemplateForUser(templateErrorClient, USER, {
    templateId: "template-a",
  });
  assert.equal(templateResult.ok, false);
  assert.equal(callsFor(templateErrorClient.calls, "transactions", "insert").length, 0);

  const categoryErrorClient = createSupabaseMock({ categoryError: { message: "category read failed" } });
  const categoryResult = await createTransactionFromTemplateForUser(categoryErrorClient, USER, {
    templateId: "template-a",
  });
  assert.equal(categoryResult.ok, false);
  assert.equal(callsFor(categoryErrorClient.calls, "transactions", "insert").length, 0);

  const walletErrorClient = createSupabaseMock({ walletError: { message: "wallet read failed" } });
  const walletResult = await createTransactionFromTemplateForUser(walletErrorClient, USER, {
    templateId: "template-a",
  });
  assert.equal(walletResult.ok, false);
  assert.equal(callsFor(walletErrorClient.calls, "transactions", "insert").length, 0);

  const insertErrorClient = createSupabaseMock({ insertError: { message: "insert failed" } });
  const insertResult = await createTransactionFromTemplateForUser(insertErrorClient, USER, {
    templateId: "template-a",
  });
  assert.deepEqual(insertResult, { ok: false, error: "insert failed" });
});

test("keeps the category compatibility helper behavior", () => {
  assert.equal(isCompatibleQuickAddCategory(null, "expense"), false);
  assert.equal(isCompatibleQuickAddCategory({ type: "income" }, "expense"), false);
  assert.equal(isCompatibleQuickAddCategory({ type: "expense" }, "expense"), true);
});

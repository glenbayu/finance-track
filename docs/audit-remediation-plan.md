# Audit Remediation Plan — Finance Track

> **Status:** Planning only. This document does not change application behavior.
>
> **Baseline:** main at cce47444b7bbf8a8b76cc201f3df2484e3ac63bf.
>
> **Working rule:** Implement in small, reviewable PRs. Do not delete codex/quality-gates until all remediation items are implemented, CI passes, relevant behavior has been tested, and the final audit is clean.

## Goals

- Protect financial data integrity: no duplicate rollover/admin-fee entries and no silent balance changes.
- Enforce transaction/category and wallet ownership rules on the server and at the database boundary.
- Make transaction duplication predictable and prevent incorrect transaction-type conversion.
- Use one consistent business timezone for transaction dates.
- Add repeatable tests for critical financial rules before considering the repository fully audited.

## Implementation TODO

### P0 — Make rollover recalculation idempotent and race-safe

**Primary files**
- lib/transactions/rollover.ts
- app/(app)/page.tsx
- app/(app)/transactions/actions.ts
- app/(app)/settings/actions.ts
- New Supabase migration(s), only after reviewing existing production data.

**Why**
The dashboard can trigger rollover recalculation, and manual actions can also trigger it. The current read-then-insert/update/delete flow is not atomic. Two overlapping requests can both observe that a generated entry is missing and both insert it. A failed/retried partial process can also leave a mixture of old and new generated entries.

**Tasks**
- [ ] Define the canonical identity of generated entries: user, wallet, transaction date, generated-entry kind (admin fee / positive rollover / deficit rollover), and any required period key.
- [ ] Read-only audit existing data for duplicate generated entries before introducing uniqueness constraints. Produce a report; do **not** automatically delete or rewrite historical rows without a deliberate reconciliation rule.
- [ ] Design a database-backed atomic operation for recalculation (prefer a transactionally executed database function/RPC or equivalent). A TypeScript sequence of separate requests is not enough to guarantee atomicity.
- [ ] Add database uniqueness/idempotency protection for generated entries, after the duplicate-data preflight passes.
- [ ] Ensure the operation can retry safely and cannot leave partially applied monthly results. Recalculation should deterministically converge on expected values.
- [ ] Make callers surface a safe, actionable error and revalidate pages only after successful completion.
- [ ] Document how to run a dry-run/read-only reconciliation against a test database before production rollout.

**Acceptance criteria**
- Running recalculation twice yields exactly the same generated records and balances.
- Two concurrent recalculation requests cannot create duplicate admin fees or rollover rows.
- A forced failure does not silently report success or leave a partially committed month.
- Existing historical transaction rows are preserved unless a separate, reviewed reconciliation explicitly authorizes changes.

**Tests**
- Unit tests for expected rollover type/amount per wallet.
- Database integration tests for repeat invocation, concurrent invocation, and failure/rollback.
- Manual smoke test on a non-production Supabase project before rollout.

### P1 — Enforce transaction/category type consistency on the server

**Primary files**
- app/(app)/transactions/new/page.tsx
- app/(app)/transactions/[id]/edit/page.tsx
- Optional database migration for defensive enforcement where practical.

**Why**
The transaction create/edit server actions check category existence/ownership but do not consistently require the category type to match the transaction type. Client-side category filtering is not a security or data-integrity boundary.

**Tasks**
- [ ] Validate transaction type against a strict allow-list before using form values.
- [ ] For income/expense, validate that the category belongs to the user or is an allowed default category, is not archived, and has exactly the same type as the transaction.
- [ ] Require category to be null for transfers and adjustments.
- [ ] Apply the same validation to create and edit, including malformed or tampered form submissions.
- [ ] Check whether changing an existing transaction's type needs an explicit category reset/reselection rule.
- [ ] Consider a database-level guard so writes that bypass Server Actions cannot create invalid relationships.

**Acceptance criteria**
- Income cannot reference an expense category, and expense cannot reference an income category.
- A category owned by another user is always rejected.
- Archived categories cannot be newly assigned.
- Transfer/adjustment rows do not receive a category accidentally.
- Existing valid history is not silently rewritten.

**Tests**
- Positive cases for income, expense, transfer, and adjustment.
- Negative cases for type mismatch, archived category, another user's category, missing category, and tampered form values.

### P1 — Make transaction duplication type-safe

**Primary files**
- components/transactions/duplicate-transaction-button.tsx
- app/(app)/transactions/new/page.tsx
- app/(app)/transactions/page.tsx

**Why**
The duplicate button is currently available for all transaction types, but the new-transaction form only supports income, expense, and transfer input, while the duplicate-prefill logic maps non-income types to expense. This can turn a transfer or signed balance adjustment into an expense.

**Tasks**
- [ ] Choose and document supported duplicate behavior.
- [ ] Safe initial choice: show duplicate only for income/expense until transfer duplication is implemented end-to-end.
- [ ] If transfer duplication is supported later, preserve source and destination wallets, validate that both belong to the current user, and prefill the form as transfer.
- [ ] Do not duplicate signed balance adjustments into a normal transaction form. If adjustment duplication is desired, implement an explicit adjustment-specific flow.
- [ ] Keep server-side ownership checks on the source transaction and all referenced wallets/categories.

**Acceptance criteria**
- Duplicating income/expense creates a new draft with the same supported type and safe fields, but not the original transaction ID/date.
- Transfer and adjustment cannot silently become expenses.
- An inaccessible/foreign source transaction cannot leak its details into a new form.

**Tests**
- UI visibility by transaction type.
- Prefill tests for income/expense.
- If supported, transfer prefill test.
- Foreign or non-existent source transaction behavior.

### P1 — Use the Asia/Jakarta business date consistently

**Primary files**
- app/(app)/wallets/page.tsx
- lib/utils/date.ts

**Why**
Wallet balance adjustment currently derives its transaction date with new Date().toISOString().split("T")[0], which uses UTC. The shared date utilities use Asia/Jakarta. Around midnight UTC, an action performed in Indonesia can be stored under the previous business date.

**Tasks**
- [ ] Replace ad-hoc UTC date extraction with the existing shared business-date helper.
- [ ] Search the repository for other toISOString().split("T")[0] and similar ad-hoc business-date constructions; decide deliberately which need business timezone and which represent UTC timestamps.
- [ ] Keep timestamp fields such as created_at in UTC; only business-date columns should use the local business date.
- [ ] Add deterministic tests for dates around the UTC/Jakarta day boundary.

**Acceptance criteria**
- A balance correction created at 00:30 WIB is saved under the correct Jakarta calendar date.
- Existing UTC timestamps are not changed.
- Month filters and rollover day boundaries continue to agree with the shared date helpers.

### P1 — Enforce ownership of related rows at the database boundary

**Primary files**
- Existing Supabase migrations for transactions, wallets, categories, budgets, and quick_add_templates.
- Add new migrations; do not silently rewrite already-applied migrations.

**Why**
Some RLS policies verify that a row's user_id is the authenticated user but do not prove that all referenced wallet/category IDs are owned by that user or are an allowed shared/default category. Server-side checks help, but direct database/API writes should not be able to create cross-user relationships.

**Tasks**
- [ ] Map all foreign-key relationships and intended exceptions (e.g. shared default categories).
- [ ] Choose a database-enforced design: composite foreign keys where practical, or carefully written trigger/policy checks. Avoid a check that accidentally blocks legitimate default categories.
- [ ] Enforce wallet ownership for source and destination wallets on a transaction.
- [ ] Enforce category ownership and compatible type for transaction and budget references, while allowing only intended shared categories.
- [ ] Apply matching category ownership/type rules to quick-add templates.
- [ ] Review SECURITY DEFINER functions for fixed search_path, minimal privileges, and intended execution grants.
- [ ] Add tests using authenticated user A and user B. Do not validate only with a service-role connection that bypasses RLS.
- [ ] Preflight existing rows for invalid cross-user references before enabling constraints; report and reconcile exceptions deliberately.

**Acceptance criteria**
- A user cannot create or mutate a transaction referencing another user's wallet.
- A user cannot create/edit a budget or template against an unauthorized category.
- Shared/default categories remain usable only in the intended ways.
- Migrations fail visibly on unresolved bad existing data rather than silently dropping or mutating user data.

### P2 — Prevent category type edits from invalidating existing usage

**Primary file**
- app/(app)/categories/page.tsx

**Why**
A category's type can be changed while existing transactions, budgets, or quick-add templates still reference it. This can misclassify historical transactions or make existing budgets/templates incompatible.

**Tasks**
- [ ] Before changing category type, check transaction, budget, and template usage, handling missing-table errors only where compatibility is genuinely intended.
- [ ] Safest initial behavior: allow renaming, but reject changing type while the category is in use and give the user a clear explanation.
- [ ] If type migration is later required, implement a separate explicit flow with a preview of affected transactions/budgets/templates and an atomic update.
- [ ] Revalidate all affected pages only after a successful update.

**Acceptance criteria**
- A used category cannot be switched from income to expense or vice versa through the ordinary edit form.
- Rename remains available.
- An unused category can change type if that behavior is still desired.
- Existing reports/budgets/history remain consistent.

### P2 — Dependency security review

**Primary files**
- package.json
- package-lock.json
- .github/workflows/quality.yml

**Tasks**
- [ ] Capture a fresh npm audit --json report on the same branch/runtime and identify direct vs transitive advisories.
- [ ] Review available patched versions and breaking-change notes.
- [ ] Upgrade in small groups; avoid blind npm audit fix --force.
- [ ] Run lint, typecheck, build, and relevant behavioral tests after every upgrade batch.
- [ ] Decide whether to add an audit job to CI with an explicit severity/policy threshold rather than allowing unpredictable failures.

**Acceptance criteria**
- Each advisory is recorded with package, severity, dependency path, fix status, and decision.
- No unreviewed forced major upgrade is included.
- CI passes after dependency changes.

### P2 — Add repeatable tests for critical business rules

**Tasks**
- [ ] Review the current test tooling before selecting a framework; keep the dependency footprint proportionate.
- [ ] Add unit tests for signed adjustments, wallet balance arithmetic, transaction/category validation, business-date handling, and rollover expected values.
- [ ] Add database integration tests for the atomic rollover operation and cross-user RLS cases.
- [ ] Add test script and make CI run tests before build.
- [ ] Document the exact manual smoke-test checklist for a non-production Supabase environment.

**Acceptance criteria**
- Critical financial rules can be rerun after future changes without relying solely on manual checks.
- CI fails when a regression test fails.
- Tests do not require production secrets or mutate production data.

## Recommended execution order

1. [ ] Create a disposable/test Supabase environment or verified backup and capture baseline counts/balances.
2. [ ] Add the test foundation and pure business-rule tests.
3. [ ] Fix server-side category validation and transaction duplication; add regression tests.
4. [ ] Correct business-date handling and add timezone tests.
5. [ ] Design, preflight, and implement atomic/idempotent rollover with database integration tests.
6. [ ] Add database relationship ownership enforcement after auditing existing data.
7. [ ] Prevent category type edits that invalidate existing usage.
8. [ ] Review and resolve dependency advisories in controlled batches.
9. [ ] Run all checks and the manual smoke-test checklist; review the complete diff.
10. [ ] Merge remediation PR(s), confirm main CI is green, complete final code/data review, then delete the temporary branches.

## Global definition of done

- [ ] All items above are either implemented or explicitly deferred with a reason and owner.
- [ ] No unresolved P0/P1 finding remains.
- [ ] Lint, typecheck, production build, unit tests, and relevant database integration tests pass.
- [ ] Migration preflights are clean and no production records were silently removed or rewritten.
- [ ] Manual tests are run against a non-production database, then a reviewed production rollout is performed.
- [ ] The final branch diff is reviewed and audit findings are closed with evidence.
- [ ] Only after these gates are met, delete codex/quality-gates and any other completed temporary implementation branch.

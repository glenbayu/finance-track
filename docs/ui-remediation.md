<!-- Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V3 · in-place remediation, existing app identity retained -->
# Hallmark UI remediation

Date: 9 September 2026

## Scope and approach

App-wide UI repairs, prioritizing misleading financial presentation, inaccessible controls, dialog placement, mobile usability, and shared consistency. The existing teal identity, route structure, data model, financial calculations, authentication rules, and financial server actions are retained. Existing unrelated worktree changes were preserved.

Hallmark informed the use of native controls, browser-top-layer dialogs, clearer hierarchy, reduced decoration, explicit focus states, and narrow-screen layout checks. This is an in-place repair, not a replacement theme or a claim that every legacy component passes all 58 Hallmark gates.

## Route inventory

| User-facing route | Review scope |
| --- | --- |
| `/` | Dashboard, balances, wallet links, quick add, category pie, trend, monthly history |
| `/transactions` | Desktop table, mobile rows, search, date/type/category/sort filters, pagination, row actions |
| `/transactions/new` | Expense, income and transfer UI; amount, date, wallets, categories and notes |
| `/transactions/[id]/edit` | Existing-record edit, return navigation, duplication/deletion entry points, adjustment guard |
| `/budgets` | Summary, empty state, category disclosures, amount fields and deletion confirmation |
| `/categories` | Create, active/archived lists, category controls and deletion confirmation |
| `/wallets` | Balance summary, grouped wallets, create/edit/correction/deletion dialogs |
| `/reports` | Summary, comparisons, charts, forecast explanation, category and daily tables |
| `/more` | Profile, edit dialog, secondary navigation and preferences |
| `/settings` | Appearance, privacy, currency and rollover UI |
| `/settings/templates` | Template form, icon/color controls and existing-template actions |
| `/login` | Authentication layout, labels and autocomplete |
| `/signup` | Authentication layout, labels and autocomplete |
| `/offline` | Offline state and accurate capability copy |
| Unknown route / not-found | Recovery state |

Shared application/root layouts, loading UI, error boundary, navigation, toasts, buttons, inputs, selects, dialogs, amount formatting and responsive rules were also reviewed. Session API endpoints are not user-facing pages.

## Changes by priority

### High impact

| Issue | Remediation | Status |
| --- | --- | --- |
| Dialogs could be constrained by transformed layouts or sit behind navigation | Shared native `<dialog>` rendered in the browser top layer, with viewport-limited scrolling, named title, Escape/backdrop dismissal, keyboard isolation and focus restoration. Profile and wallet forms use the same primitive. | Fixed in shared UI |
| Amount privacy was inconsistent across pages and chart tooltips | Shared currency/formatting consumers respect privacy; initial server snapshot masks amounts; monetary charts are hidden while privacy is active. Settings explain that editable form values remain visible. | Fixed for reviewed amount/chart surfaces |
| Negative wallet balances could lose their sign during correction | Correction input preserves the sign and offers an explicit positive/negative toggle. Hidden submitted value retains the sign; existing correction action is unchanged. | Fixed in correction UI |
| Historical-month balance could be used as today's correction basis | Historical/future-month correction UI directs users to the current month and does not expose a correction submit form. Copy states the date/basis of the existing action. | UI guard added |
| Editing a negative adjustment could silently turn it positive | Existing negative amount is preserved and read-only; saving that unsupported edit is disabled with guidance to use wallet correction. | Safeguarded; signed edit validation remains a backend follow-up |
| Failed dashboard/wallet reads could look like valid zero totals | Relevant read failures now enter the error state instead of rendering fabricated zero balances. Financial calculations are unchanged. | Fixed for these reads |
| Mobile transaction grouping overrode the selected sort | Only adjacent equal dates are grouped; the original ordered query result is preserved. Regression tests cover repeated dates and ascending order. | Fixed |
| Category pie excluded categories beyond the display limit | Additional categories aggregate into “Lainnya (gabungan)”; displayed slices still sum to the full total. | Fixed |
| Delete actions used inconsistent confirmation patterns | Category, budget and template deletion use the shared confirmation-submit control, preserving original form actions and native validation. Wallet/transaction confirmations inherit the shared dialog behavior. | Fixed in these entry points |

### Navigation, forms and responsive usability

| Issue | Remediation |
| --- | --- |
| Desktop profile/secondary destinations were hard to find | Added “Profil & Lainnya” to desktop navigation; clarified mobile navigation labels. |
| Dashboard wallet-setup link pointed at a missing route | Links now lead to `/wallets`; wallet settings icon gets an accessible name and 44px target. |
| Edit/cancel lost transaction-list context | Session-scoped list memory restores filters/sorting/page in back/cancel links and bare successful transaction redirects. Stored destinations are restricted to the local transaction list. |
| Custom selects had inconsistent keyboard/touch/reset behavior | Shared `FormSelect` now uses native selects with accessible names and the existing value/change API. |
| Forms lacked accessible names/autocomplete | Added accessible names to audited fields; auth labels and autocomplete are associated appropriately. |
| Narrow transaction controls and labels clipped | New-entry rows reflow; transaction type icons hide on small screens; mobile list selects stack; active month/year stays visible when the viewport changes. |
| Swipe-only mobile actions were undiscoverable | Each row has a visible 44px action toggle; hidden actions are inert, Escape closes the panel, and reduced motion is respected. |
| Mobile transaction names were squeezed beside amounts | Names and amounts reflow onto separate rows on narrow screens. |
| Wallet balance summaries overflowed narrow screens | Grid children can shrink; wallet summary content wraps and actions have consistent minimum targets. |
| Long secondary content displaced primary tasks | Wallet-type help, category creation/archive and detailed monthly comparisons use disclosures; settings controls stack on narrow screens. No underlying information was removed. |
| Toasts competed with the bottom dock | Global mobile toast offset clears navigation; relevant feedback uses status/alert semantics. |
| Quick-add errors were behind the confirmation dialog | Confirmation errors render inside the dialog. Wallet-selection limitations are disclosed, with an edit/full-form path. |

### Visual consistency and accessibility

- Resolved the font fallback at the body level; retained a system sans stack and tabular numerals for financial data.
- Appended shared spacing/radius/focus/semantic-color rules to the existing stylesheet without replacing it.
- Standardized shared controls to a 44px minimum, readable input text, visible keyboard focus, disabled cursors and restrained transitions.
- Improved shared muted/financial text contrast and primary-button ink in light/dark themes.
- Reduced nested card decoration and oversized page-header hierarchy; removed the page-wide transformed entrance animation.
- Improved long category-name wrapping and chart legends; added expandable chart data tables and keyboard-operable report series controls.
- Respect reduced-motion preferences in chart/row behavior.
- Replaced the dashboard-shaped generic loading screen with a neutral application loader.
- Standardized visible Finance Journal branding and clarified Indonesian labels in core transaction/report/settings UI.
- Corrected offline copy: cached offline UI does not imply offline access to financial records or offline saving.

## Verification

- Production build: `npm.cmd run build` passed, including Next.js TypeScript and static-page generation.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- Lint: `node node_modules/eslint/bin/eslint.js app components hooks lib/ui scripts tests` passed.
- Read-only AST comparison of inline server-action bodies across modified pages against Git HEAD: 18 compared, zero changed. Financial library/API/dependency files were not edited.
- Browser interaction checks passed: profile/wallet dialog placement, keyboard isolation, Escape, focus/scroll restoration; unsaved balance-sign toggle and native validation; historical-month correction guard; filtered edit return links; mobile row-action toggle; wallet/transaction/report privacy masking.
- Final route/viewport/theme sweep and screenshot review: see final review notes below.


## Boundaries and remaining follow-ups

1. **Quick-add wallet policy:** manual quick add still has the existing wallet-assignment limitation; template creation still uses the existing first-created wallet behavior. The UI now warns users, but introducing a default-wallet policy or changing transaction creation requires a separate functional decision.
2. **Negative adjustment editing:** the existing transaction-update action rejects non-positive amounts. The UI prevents accidental sign loss, but full signed-adjustment editing needs a deliberate validation/business-logic change.
3. **Wallet deletion eligibility:** usage displayed here is month-scoped. All-history deletion constraints and database enforcement should be reviewed separately; this pass did not change deletion rules.
4. **Rollover processing:** existing automatic processing on dashboard navigation and the manual action remain intact. The safety reviewer blocked clicking the rollover-processing control during testing; it was source-reviewed only. Other shared dialogs were tested instead.
5. **Authentication recovery:** no new password-reset flow or session policy was introduced.
6. **Verification limits:** browser checks use desktop Chrome with emulated CSS viewport sizes, not physical iOS/Android devices. No screen-reader certification, complete WCAG conformance claim, financial save/delete integration test, forced backend-failure test or deployment is implied. Legacy one-off styles remain outside the repaired shared patterns.
7. **Available test data:** the signed-in account had no saved budgets or active quick-add templates. Empty/create surfaces were reviewed live; populated template actions, destructive confirmations, and existing negative-adjustment records were additionally source-reviewed rather than created just for testing.

## Final review notes

- Reviewed all 14 page routes plus not-found at **320, 375, 414, 768, 1024 and 1440 CSS pixels**, in **light and dark** themes: **180 combinations**. The actual edit route was discovered from an existing transaction rather than guessed.
- All final automated combinations reported **zero root horizontal overflow, zero off-viewport visible form controls in the viewport, and zero unnamed visible input/select/textarea fields**. Horizontally scrollable table containers are intentionally excluded from the clipped-control check.
- Captured full-page mobile screenshots at 375px for every route in both themes, alongside viewport screenshots at 320/375/768/1440. Visually reviewed mobile forms, lists, lower-page report/settings/template sections, desktop tables/charts/navigation, tablet layout and authentication/offline states.
- The screenshot pass caught and corrected issues that geometry checks alone missed: font fallback, clipped filter labels, selected month hidden after resizing, squeezed transaction names, dense secondary settings/report content and inconsistent report labels.
- The final report-only cleanup was rerun at all six widths/both themes: **12 additional passing combinations**. The production build and lint were rerun successfully after that cleanup.
- Browser evidence remains in the local temporary directories `finance-ui-review-1OcxQC` (full sweep), `finance-ui-review-Hrnue3` (final reports pass) and `finance-ui-interactions-DkAgms` (interaction checks). These contain account screenshots and are deliberately not copied into the repository.
- Native dialog interaction tests at **375 × 667** passed. Privacy preference and browser size/theme overrides were restored by the test scripts. No financial form was saved, deleted, duplicated or recalculated by clicking a processing control.

Outcome: the high-impact UI defects are repaired or explicitly guarded, with shared fixes applied across the application. Remaining functional decisions and device/accessibility coverage limits are listed above rather than presented as completed work.

### Desktop navigation follow-up

Desktop “Profil & Lainnya” and “Pengaturan” are now one destination: **Profil & Pengaturan**. The settings page carries the account summary, profile editor, and shortcuts to wallets, categories, budgets, and templates before the appearance/currency/synchronization sections. The mobile “Lainnya” page remains separate because it is the mobile navigation hub and keeps the bottom dock compact.

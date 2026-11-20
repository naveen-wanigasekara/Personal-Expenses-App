# QA fixes and dev release — 20 November 2026

## Resolved findings

- QA-01: Card save callbacks use the loaded workspace/card state and persist payment dates. Creation, edits, reload, deletion and failed writes have integration coverage.
- QA-02: Notifications use individual saved installment transactions, with the inclusive 20-day window applied per occurrence. Moved/deleted rows are not regenerated; two charges in one month keep their own amounts and completion identities. Legacy completion keys are honored against their original schedule month.
- QA-03: Installment edit previews and saved totals combine actual preserved charges with the revised future schedule. Future transaction IDs/dates are preserved after individual edits.
- QA-04: Repayment options use the borrower's complete loan history for numbering, matching the loan cards after earlier loans settle. Ledger installment sequence badges likewise follow occurrence IDs after a date move.
- QA-05: Help no longer points to removed Insights actions or describes future installments as immediately outstanding.

## Additional fixes and UI improvements

- Category writes derive their payload before updating React state, avoiding deferred updater/stale closure assumptions.
- Card deletion checks the current linked-loan records, protecting loans created after initial load.
- Shared save guards prevent duplicate card/plan/investment/valuation writes and await completion before closing dialogs; rejected saves are surfaced. Existing fail-closed refresh behavior for uncertain financial writes remains intact.
- Budget saved feedback resets on edits and scope changes.
- Same-day investment values and history use consistent creation-time/ID tie-breakers instead of database response order.
- Ledger daily totals explicitly say “Net spending.” Categories and dashboard customization actions have contextual accessible names.
- Notification metadata/status text is larger, recurring bills have month headings, and duplicate type descriptions are removed.
- Application and vendor code are separate cacheable build chunks. The build's largest chunk is approximately 456 kB; the previous oversized main-chunk warning is eliminated without suppressing its limit.

## Verification

- `npm test`: **194 passed** (126 Node tests, 68 UI tests); production build succeeds.
- Added full-component synthetic journeys for card CRUD/reload, linked-card protection, plan cancellation, category CRUD, stable loan selection, rejected card writes, investment/value CRUD/reload, budget overrides and recurring-reminder persistence/deletion.
- Additional date tests cover cross-month moves, independently completed same-month charges, deleted occurrences, old completion IDs, original date anchors, preserved historical amounts, and deterministic same-day investment values.
- Browser regression testing of the isolated source copy confirmed card payment-date persistence after reload, LKR 46,000 edited-plan totals, and a moved December 5 installment appearing once for LKR 10,000 with no phantom November reminder. Small-height and desktop notifications had no horizontal overflow.
- No database migration, legacy bulk rewrite, live financial-data mutation, authentication weakening or paid service was introduced. The main branch is outside this release.

## Remaining verification limits

Browser regression data services were isolated synthetic adapters. Live authentication/email/MFA, live encrypted persistence, multi-device concurrency/network recovery, and installed iOS/Android PWA behavior are not certified by these tests. The earlier Vercel account redirect was blocked by automatic approval review; no bypass was attempted. Supabase reported the dev project ACTIVE_HEALTHY, which is metadata, not an E2E test.

The identified reproducible defects are resolved within the tested scope. This dev release is ready for the user's final smoke test; it is not an unconditional production sign-off.


## Borrower screenshot follow-up

- Fixed the borrower toolbar disclosure panel opening beyond the left viewport edge. It now opens from the left side of its trigger; loan-row menus retain their existing right alignment.
- Applied the seamless entry footer treatment to borrower edit/merge forms as well as New Entry. No separate background, divider or button shadow; scrolling and keyboard-safe footer sizing retained.
- Added Manage borrower → Delete borrower with a confirmation sheet, cancellation, pending-write protection and error feedback. Only borrowers without any loan history can be removed. Active, settled, archived, merged and legacy-associated history is protected. Empty merged aliases are removed together in one existing revision-checked write; no schema changes or financial data cascade.
- Regression verification: production build, 128 Node tests and 71 UI tests passed (199 total). Added checks for empty profile/alias deletion, unchanged financial projections, protected history, cancellation, reload persistence and rejected deletion writes.
- Browser QA used an isolated copy with synthetic local data and mock persistence. Checked mobile light/dark menus, 44px menu targets, edit/save and cancel, delete confirmation, desktop dialog bounds, transparent/borderless footer, and reduced-height scrolling with Save accessible. At 390px width menu bounds were left 18px/right 236px; desktop dialog was centered at 520px width in a 1280px viewport.
- Live backend deletion and installed-device keyboard/PWA behavior were not exercised. Production and real financial records were not changed.

# Savings withdrawals and money lent — dev release

## User flow

Use the existing **New Entry** button for Money Lent, Loan Repayment, Withdraw from Savings, and Transfer Money. Normal income, cash purchases and card payments can select Cash or Bank. Existing entries retain their amounts, dates, categories, IDs and history; unlabeled old entries are treated as Cash.

- A savings-funded loan reduces savings and increases principal owed to you once.
- A credit-card-funded loan increases that card's debt and principal owed to you, without spending or cash changes.
- A principal repayment increases the selected Cash/Bank/Savings balance and reduces the loan principal. It is not income.
- Interest received increases the selected balance and income; it does not reduce principal.
- A cash repayment never settles a credit card. Record a separate Card Payment.
- A transfer only moves balances. Savings withdrawals are Savings → Cash/Bank transfers.
- Corrections are available in the Ledger and Money Lent history. A repayment with both principal and interest has two linked ledger lines, backed by one saved repayment; editing/deleting either line edits/deletes the whole repayment.
- Original transaction deletion keeps the existing five-second Undo. Loan/repayment/transfer deletion requires confirmation and reverses its derived effects. A loan with repayments cannot be deleted until those repayments are removed.

## Interest and dates

Interest is simple, due on completed monthly or yearly anniversaries from the loan's date. Month-end dates clamp to the last day of shorter months. Remaining-principal interest uses the balance at the start of each period; principal paid on a due date reduces the following period. There is no compounding, automatic capitalization, or partial-period charge. Unpaid interest and advance interest credits stay separate from principal. Enter an agreed final interest settlement explicitly when recording an early payoff.

Repayment arrangements: single, flexible, interest-only, or 1–120 equal monthly principal installments. Interest is additional to scheduled principal. An optional final principal due date can be set. A card's optional next payment date is a manual reminder, not a computed statement/minimum amount; update it for each statement.

Insights shows available cash+bank, bank balance, remaining savings, principal owed to you, unpaid loan interest, and positive card debt. Income/Spending exclude loan principal and transfers. Cash/bank/savings and receivables use the selected month capped at today; card debt remains current, matching Cards. Existing saved Insights layouts are retained and the new overview is added as a customizable section. The Ledger includes a Loans & Transfers filter.

## Persistence and release

1. Inspect the isolated **dev-expense-app** project and take the usual schema/data snapshot.
2. Apply **db/money_lending.sql only to dev** after the existing schema/security migrations. This migration adds a nullable encrypted account on transactions, a nullable encrypted card payment date, encrypted `money_records`, RLS/session/quota guards, and revision-protected atomic save/snapshot RPCs. It never rewrites/deletes existing financial records.
3. Verify RLS, authenticated snapshot/save, encryption and existing record counts. Use a disposable test account for the three examples.
4. Deploy the `dev` branch and test on desktop/mobile/PWA. Do not promote production until the user finishes acceptance testing.

Without the migration, existing app functionality stays available and new entry choices are disabled with an explanation. A database/authentication failure is not treated as an empty account: the workspace requires a reload rather than permitting new writes against missing data.

All money data is encrypted using the existing user-bound encryption. A single database snapshot returns transactions, cards, lending records and a revision. The atomic write checks that revision and existing row snapshots; concurrent/legacy writes invalidate it. A rejected or uncertain save requires reloading. Savings guards check the whole dated history so backdated changes cannot silently invalidate later withdrawals. Loan principal overpayment, invalid dates, orphan repayments, and deleting a card used to fund a loan are blocked. Cash/bank deficits remain allowed to preserve existing history/import behavior; only savings withdrawals/lending enforce an available-funds check.

## Automated validation

Run `npm test` (production build, Node calculations/database/security tests, React interaction tests). New tests cover all three discussed examples; withdrawal edits/deletes and backdating; original/remaining/annual interest and month ends; interest-only payments and missed interest; installment dues; principal overpayment; persistence across workspace remount; card payment separation; account isolation; ciphertext; session revocation; stale revisions; and atomic rollback.

Local database tests use PGlite/Postgres with synthetic users and apply the actual additive migration. React tests use synthetic provider boundaries; they do not replace a live dev-database smoke test.

## Dev verification — 20 November 2026

Applied the additive migration to the isolated dev database and verified its existing schema/security functions matched the repository beforehand. Existing counts remained 971 transactions, 7 cards, 10 budgets, 37 installment plans, 1 recurring reminder, 3 investments, 4 valuations and 3 settings rows. Before/after checksums of existing transactions, cards and settings matched exactly.

Ran the real authenticated database RPCs with synthetic encrypted records inside a transaction that was rolled back. Verified savings-funded lending/repayment, credit-card lending followed by cash repayment and a separate card payment, 5% monthly interest-only repayment, transfers, edits, deletions, stale revisions and atomic rollback. Decrypted the returned ciphertext through the app's encryption functions and reconciled balances using the app's calculation functions. No synthetic users or financial records remained after rollback.

A follow-up `money_lending_cascade_fix.sql` preserves auth-account deletion cascades: child-row deletion must not recreate a revision after its owning auth user is gone. Fresh setups include the same fix in the main migration. The database regression test covers this cleanup.

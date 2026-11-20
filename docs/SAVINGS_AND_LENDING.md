# Savings withdrawals and money lent — dev release

## User flow

**New Entry** shows only **Income** (money received) and **Expenses** (money paid or spent). Each opens a subtype selector and one form:

| Group | Types |
| --- | --- |
| Income | Regular income; Repayment received; Withdraw from savings |
| Expenses | Purchase or bill; Lend money; Add to savings; Pay credit card; Card interest or fees |

Purchase or bill combines Cash / Bank and credit card using one payment-method selector. Savings entries have fixed directions between Savings and Cash / Bank. Contextual lend/repay shortcuts open this same central flow with borrower and loan preselected. Income / Expenses returns to the two-way chooser. Ledger filters Money received and Money paid or spent follow entry direction; the financial reports remain Income earned and Spending, excluding principal and transfers.

Forms use compact category/card selectors. Loans start interest-free; rate fields appear only when Charge interest is enabled. Notes and extra loan terms are optional expandable sections. A separate footer keeps Record visible while fields scroll and the on-screen keyboard is open.

### Borrowers and archive

Borrower profiles have stable IDs and are stored as encrypted `money_records` with kind `borrower`. Multiple dated loans link to the same borrower ID; each keeps its own source, rate, arrangement, principal and repayments. Add borrower also allows registering a person before lending. Repayments choose the borrower first, then the specific dated loan. Borrower details show combined all-loan totals, individual loans and complete dated history.

Legacy loans are grouped by exact stored name (after outside trimming); case and internal-space variants are not silently merged. On first selection/edit, a legacy group is promoted to a stable profile with its exact legacy name as an alias. Renaming and explicit merging update identity metadata, preserving every original loan and repayment row. Merge duplicate borrower is an explicit action for records of the same person. Names are checked against normalized existing names to prevent new duplicates.

Money Lent defaults to active loans. Settled loans (zero principal and zero accrued interest due) move automatically to Archive. An inactive loan can be manually archived and restored. Archiving never forgives debt, changes balances or deletes payment history. Overdue loans remain active. The Borrowers directory includes people with no active loans; details and full history include archived activity. This is the requested Monthly active/archive change, clarified by the user as the Money Lent tab; budget and card installment screens are unchanged.

Received activities have a green tinted background, visible edge and Received text. Settled badges have an explicit label and stronger border. Both themes use foreground/background pairs with at least 4.5:1 normal-text contrast.

Existing entries retain their amounts, dates, categories, IDs, funding identifiers and history. Historical Cash and Bank records are displayed together and summed as one available balance, without rewriting the database. Editing an old Bank entry preserves that source. Legacy internal cash-to-bank transfers remain editable as historical transfers and do not change the combined balance.

- A savings-funded loan reduces savings and increases principal owed to you once.
- A credit-card-funded loan increases that card's debt and principal owed to you, without spending or cash changes.
- A principal repayment increases the selected Cash / Bank or Savings balance and reduces the loan principal. It is not income.
- Interest received increases the selected balance and income; it does not reduce principal.
- A cash repayment never settles a credit card. Record Expenses → Pay credit card.
- A transfer only moves balances. Savings withdrawals are Savings → Cash/Bank transfers.
- Corrections are available in the Ledger and Money Lent history. A repayment with both principal and interest has two linked ledger lines, backed by one saved repayment; editing/deleting either line edits/deletes the whole repayment.
- Original transaction deletion keeps the existing five-second Undo. Loan/repayment/transfer deletion requires confirmation and reverses its derived effects. A loan with repayments cannot be deleted until those repayments are removed.

## Interest and dates

Interest is simple, due on completed monthly or yearly anniversaries from the loan's date. Month-end dates clamp to the last day of shorter months. Remaining-principal interest uses the balance at the start of each period; principal paid on a due date reduces the following period. There is no compounding, automatic capitalization, or partial-period charge. Unpaid interest and advance interest credits stay separate from principal. Enter an agreed final interest settlement explicitly when recording an early payoff.

Repayment arrangements: single, flexible, interest-only, or 1–120 equal monthly principal installments. Interest is additional to scheduled principal. An optional final principal due date can be set. A card's optional next payment date is a manual reminder, not a computed statement/minimum amount; update it for each statement.

Insights shows available cash+bank, remaining savings, principal owed to you, unpaid loan interest, and positive card debt. Income earned/Spending exclude loan principal and transfers. Cash / Bank, savings and receivables use the selected month capped at today; card debt remains current, matching Cards. Existing saved Insights layouts are retained and the new overview is added as a customizable section. The Ledger includes a Loans & Transfers filter.

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

## Approved workflow update — 20 November 2026

This update needs no additional migration: borrower profiles and archive metadata use the existing encrypted money-record storage and revision-protected atomic saves. Existing financial rows are not rewritten. Profile creation and its first loan are committed together. Renaming, merging and archive operations use the same session, encryption, concurrency and account-isolation protections as lending.

Additional tests cover the two-group subtype routes, repeated loans, borrower selection and loan-specific repayments, standalone registration, rename and explicit merges, exact legacy grouping, unknown references and merge cycles, active/archive/restore behavior, interest outstanding after principal payoff, received ledger filtering and both-theme contrast. Deployment remains dev-only until acceptance testing.

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

## New Entry scrolling correction — 20 November 2026

The entry layout clipped overflow on the sheet and form while assigning scrolling to a flexed fieldset. Browser fieldsets use a special inner layout box, so the fields could be clipped without a usable scroll area. Scrolling now belongs to a normal `.entry-scroll` block around the transaction selector and fieldset. The fieldset retains its disabled-on-save behavior; Close and the save footer remain outside the scroll region. Borrower and merge forms use the same corrected layout.

Rendered browser verification used the real components and styles with synthetic data, without backend access. Checked phone (390×844), tablet (768×650), desktop (1280×720), and a short phone viewport (390×360) representing the space above a keyboard. Native scrolling reached the bottom and returned to the top; expanded loan notes, regular income notes and installment fields were reachable. At 390×360, the scroll region had 164px available for 918px of expanded loan content, and scrolling reached 754px while the save footer stayed within the viewport. Close and reopen remained functional. These are browser viewport checks, not a physical iOS/Android device test.

## Outstanding borrowers in repayment entry — 20 November 2026

New Income → Repayment received entries show only borrowers with unpaid principal or accrued interest as of today. The loan selector likewise offers only that borrower’s unpaid loans, preserving the borrower while any one loan remains unpaid. Fully settled and registered-without-loans borrowers are excluded. Manually archived unpaid loans remain eligible because archiving does not forgive debt. The all-settled state explains why no borrower can be selected and disables Record.

Editing an existing repayment retains its original loan even if that repayment settled it, so historical corrections remain possible. A stale shortcut falls back to an eligible loan; refreshed balances that invalidate an open selection choose an eligible borrower/loan and clear entered amounts. No stored borrower, loan, repayment or balance data is rewritten by this filtering.

## Money Lending UI consistency — 20 November 2026

Money Lent now shares the mobile header (menu, notifications and PWA refresh), page titles, search field, cards, action buttons, theme colors and empty-state patterns used by Cards, Investments, Ledger and Bank Details. A dedicated inner scroll region keeps the shared header and navigation usable. Desktop borrower cards form a two-column grid; the borrower back control stays available on desktop as well as mobile.

Loan Actions holds Edit, Archive/Restore and Delete. Repayment Actions holds Edit and Delete, with the existing confirmations and financial safeguards unchanged. Manage borrower holds Edit borrower and Merge duplicate borrower. Record repayment and Lend money remain direct actions. Action disclosures close on selection, Escape, outside pointer input or keyboard focus leaving; the panel scrolls into view when opened and touch targets remain at least 44px.

Interest-free loans omit interest amounts, calculation basis, next-interest dates and zero-interest payment breakdowns. Actual principal/interest received, accrued interest due and any advance credit remain visible when nonzero. Repaid principal appears when a payment exists; optional loan arrangements, notes and dates appear only when applicable. Borrower totals still include archived unpaid debt, and histories, lending terms, repayments and calculations are retained. No schema or stored-record changes are required.

Verification includes the full financial/security/database suite and UI tests for conditional details, secondary action callbacks, Escape/outside dismissal, shared header actions and desktop back navigation, plus browser review at phone/tablet/desktop sizes in both themes using synthetic records.

## Payment notification categories — 20 November 2026

Removed the View people & repayments and Withdraw from savings shortcuts from the Insights overview shown in the reported screenshot. Money Lent remains accessible in navigation, and savings transfers remain available through New Entry. No financial records or calculations are removed.

The notification bell now uses one live reminder list for both its badge and panel. Due Payments contains items with a known date that is overdue or today; upcoming and undated reminders are split into Monthly Credit Card (CC) Payments, Installment Payments and Other Upcoming Payments. Sources are saved card next-payment dates with positive outstanding balances, every remaining month in active finite installment plans (including future-start plans), and this/next month’s active recurring reminders. Completed or cancelled plans are not treated as active schedules.

A monthly installment without a known card deadline remains a month-only reminder, never an assumed first-of-month overdue payment. Card dates are not extrapolated across future months. Card amounts are labeled current outstanding, not bank statement/minimum amounts, and installment amounts are not added to them again. A current installment on a settled card remains a schedule reminder rather than being called overdue. Historical months without tracked payment status are not guessed unpaid.

Completion retains existing per-user/per-month local storage and legacy inst:/rec: IDs. Future occurrences are dismissed in their own billing month, leaving other months visible; card date changes use a distinct completion key. Completion does not create a transaction. Existing recurring category-based auto-dismiss is evaluated separately for each occurrence month. This is presentation/reminder logic only and needs no database migration.

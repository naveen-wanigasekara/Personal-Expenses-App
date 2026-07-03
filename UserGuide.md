# Personal Expense Finance App

A mobile-first personal finance tracker with income/expense tracking, credit card management, installment plans, investments, budgeting, custom charts, and insights.

---

## Getting Started

### Sign Up & Log In

1. Open the app and tap **Sign Up** (new user) or **Sign In** (existing user).
2. Enter your email and password. After signing up, confirm your account via the email you receive.
3. Your data syncs to the cloud automatically — accessible from any device.

> **Tip:** When prompted, install the app to your home screen for a native app experience (PWA).

---

## Navigation

Four destinations at the bottom of the screen on phone and tablet, plus a slide-in menu for the rest:

| Tab          | Purpose                                          |
| ------------ | ------------------------------------------------- |
| **Insights** | Dashboard — summaries, charts, and notifications |
| **Ledger**   | Full transaction history                         |
| **Cards**    | Credit card management and installment plans     |
| **Profile**  | Account info, User Guide, categories, reminders, and currency |

The **+ button** (floating action button) opens the Add Transaction form from any screen.

Tap the **menu icon** (three lines, top-left of any page) to reach **Budget** and **Investments** — they live in a slide-in menu instead of the bottom bar, to keep it uncluttered.

### On a bigger screen

On desktop and laptop, all five destinations — **Insights, Ledger, Cards, Investments, Budget** — are shown directly in a sidebar, with no menu needed. A persistent header shows month navigation, notifications, and your account (tap your avatar for **Account** settings). There's no separate "Profile" tab on desktop — Account settings cover the same ground.

### One shared month, everywhere

A single month selector is shared across the whole app. Change it from the top bar, or from inside any page (like a card's detail view), and every other page updates to match — including Insights, Ledger, Budget, and Card Detail.

---

## Adding a Transaction

### 1. Select a type

| Type              | When to use                          |
| ----------------- | ------------------------------------ |
| **Expense**       | Cash or bank debit purchase          |
| **Income**        | Salary, bonus, passive income, etc.  |
| **Card Purchase** | Something bought on credit           |
| **Card Payment**  | Paying off your credit card bill     |
| **Card Interest** | Interest or fees charged by the bank |

### 2. Enter the amount

Type the amount. The field formats automatically with commas. For Card Payment, the amount is pre-filled with the selected card's outstanding balance — it refreshes if you switch to a different card, so double-check it before saving.

### 3. Select a card _(card transactions only)_

Pick which credit card from the visual card selector.

### 4. Select a category

Tap a category from the grid. Tap **+ Add** to create a custom category on the fly.

### 5. Optional details

- **Note** — short description (e.g., "Lunch with client")
- **Date** — defaults to today; tap to change

Tap **Record** to save.

> **Important:** Use **Card Payment** to record paying your credit card bill — this reduces your card balance and is **not** counted as a new expense.

> **Tip:** If you delete a transaction by mistake, tap **Undo** on the confirmation banner within about 5 seconds — after that, the deletion is final.

---

## Installment Plans

When adding a **Card Purchase**, you can split it into equal monthly installments instead of recording it as a single charge.

### Setting up a plan

1. Tap **New** and choose **Card Purchase**.
2. Enter the monthly installment amount and select the card.
3. Tap **Split into installments** to enable the toggle.
4. Fill in:
   - **Plan label** — a name for this plan (e.g. "iPhone 16")
   - **Number of months** — how many monthly payments
   - **Start month** — the first month the charge appears
5. Tap **Create Plan**.

The app pre-creates all monthly transactions at once. Your card balance reflects the full outstanding amount immediately, but each month's Ledger and budget only shows that month's installment amount.

Each installment transaction displays a badge (e.g. **2/12**) so you can see where you are in the plan.

### Paying an installment

When it's time to pay your bank each month, record it as a regular **Card Payment** for the installment amount. The plan tracks the charges; Card Payments track the cash you send to settle them.

### Cancelling a plan

Open the **Card Detail** screen, find the plan under **Active Plans**, and tap **Cancel**. Past installments are kept as-is; future installments (from next month onward) are deleted and the card balance updates accordingly.

---

## Ledger Tab

### Viewing Transactions

Transactions are grouped by date with a daily subtotal per group. Each entry shows the category icon, description, and amount:

- `+` green = income
- `−` red = expense
- Card transactions show a card name badge
- Installment transactions show a progress badge (e.g. **3/12**)

### Filtering

Use the search bar and dropdowns at the top to filter by **month**, **transaction type** (All types, Income, Cash Purchase, CC Purchase), or **category**. The count shown updates to match.

### Editing a Transaction

Tap a transaction to expand it, then tap **Edit**. The form opens pre-filled — update any field and tap **Save changes**.

### Deleting a Transaction

Tap a transaction to expand it, then tap the **delete icon**.

---

## Cards Tab

### Adding a Card

Tap **+ Add Card** and fill in:

- **Card name** (e.g., "AMEX Gold")
- **Credit limit** (e.g., Rs. 500,000)
- **Opening balance** — any existing debt when you first set up the card
- **Color** — choose a gradient theme for the card

### Card Overview

The top summary shows total debt, total available credit, and overall utilization across all cards. Each card tile includes a utilization bar:

| Utilization | Status           |
| ----------- | ---------------- |
| Below 70%   | Normal           |
| 70–90%      | Warning (yellow) |
| Above 90%   | Danger (red)     |

### Card Detail

Tap a card to see:

- This month's purchases, payments, and interest charges
- **Active Plans** — all running installment plans on this card, with monthly amount, progress bar (paid/total months), and a **Cancel** option
- Full activity list for the selected month

> Deleting a card does **not** delete its linked transactions.

---

## Investments Tab

### Adding an Investment

Open the menu (top-left) → **Investments** → **+ Add an investment**, and fill in:

- **Name** (e.g., "Vanguard S&P 500", "Fixed Deposit — BOC")
- **Type** — Stocks, Mutual Fund, Fixed Deposit, Crypto, Real Estate, or Other
- **Starting amount** — what you put in
- **Start date**

### Fixed Deposits

Choosing **Fixed Deposit** as the type reveals three extra fields:

- **Interest rate** (% per annum)
- **Payout frequency** — Monthly, Quarterly, Semi-Annually, Annually, or At Maturity
- **Tenure** (months)

Unlike other investment types, a Fixed Deposit's value doesn't grow on its own. Interest is calculated and paid out separately each period, exactly like a real bank deposit — the principal stays at your starting amount until maturity. The detail view shows:

- A status badge (Active / Matured)
- The next payout date and amount (or, once matured, the total interest earned)
- A warning if your chosen payout frequency doesn't fit within the tenure (e.g. Annually with a 6-month tenure)

### Recording a Value

For non-FD investments, tap **Record value** on the investment's detail page to log its current value:

- **Current value**
- **Date** — you can backfill a past date; the investment's value always reflects whichever recorded entry has the *latest* date, not the most recently entered one
- **Note** (optional)

Each value entry can be edited or deleted from the Value History list — except the last remaining one, since an investment always needs at least one value on record.

### Value Over Time & Gain/Loss

Once an investment has two or more recorded values, a trend chart appears showing how its value has moved, with an up/down indicator vs. the first entry. Gain/loss is your current value minus your initial amount; return % is that gain divided by the initial amount. Both are shown per-investment and summed across your whole portfolio at the top of the Investments tab.

> Deleting an investment also deletes its full value history — this can't be undone.

---

## Budget Tab

### Fixed Plan vs. Month Override

- **Fixed Plan** — your default budget, applied automatically to every month
- **Month Override** — customise a specific month without changing the fixed plan

Toggle between modes at the top. Use **← →** to navigate months.

### Setting Income Targets

Enter a total expected income and per-category breakdowns (e.g., Rs. 150,000 from Fixed Income).

### Setting Expense Budgets

Enter a total spending limit and per-category limits (e.g., Rs. 30,000 for Groceries).

The **Planned Savings** summary shows: `Income Target − Expense Budget`.

### Budget Progress

Each category shows a progress bar against the target:

| Bar colour | Meaning             |
| ---------- | ------------------- |
| Green      | Within budget       |
| Yellow     | Above 80% of budget |
| Red        | Over budget         |

Tap **Save** to apply changes.

> **Tip:** Tap **Copy Fixed Plan** to pre-fill the current month with your default values, then adjust as needed.

> **Note:** Installment plan transactions count toward the relevant expense category budget in each month they appear — including future months. This lets you see upcoming financial commitments before they arrive.

---

## Insights Tab

Use **← →** to navigate between months.

### Notification Bell

The **bell icon** in the top-right of every page shows a red badge with the count of active notifications. Tap it to open the Notifications panel:

- **Installment Payments** — installment plans with a charge due this month, showing the card, current installment number (e.g. 3/12), and monthly amount
- **Recurring Bills** — any recurring payment reminders active for this month

Tap the **checkmark** on any notification to mark it as completed — it drops off the list for the rest of the month, then reappears next month automatically if the underlying plan or reminder is still active.

### Top Summary

- **Net Balance** — income minus expenses for the selected month
- **In / Out** — total income and total expenses at a glance
- **Cash in Hand** — cumulative available cash (all income minus cash expenses and card payments)
- **Card Debt Summary** — total debt and overall utilization across all cards
- **Total Investments** — sum of your portfolio's latest known values

### Net Worth Trend

A 12-month chart of your cumulative cash balance (the same figure as Cash in Hand) plotted over time, so you can see whether it's trending up or down.

### Plan vs. Actual

Compares your budgeted plan to what actually happened: income target vs. actual, expense budget vs. actual, and planned vs. actual savings.

### Cashflow Chart

A 6-month bar chart showing income and expenses side by side, with budget target lines overlaid.

### Income Breakdown — "Where it came from"

Each income category shows total received, percentage of total income, and (if budgeted) progress toward the income target.

### Expense Breakdown — "Where it went"

Each expense category shows total spent, percentage of total spending, a month-over-month delta, and (if budgeted) a progress bar vs. the limit — turns red when over budget.

### Customising the Layout

Tap the **sliders icon** (top-right) to open the Customise sheet. Every section — built-in sections and any custom charts you've created — is listed. Toggle any section on or off, reorder them with the up/down arrows, or tap **Reset to default** to restore the original built-in layout (your custom charts aren't removed). Your preferences are saved automatically.

---

## Custom Charts

Beyond the built-in Insights sections, you can build your own chart from your transaction data.

### Creating a chart

1. On Insights, tap the sliders icon to open **Customise**.
2. Tap **+ Create custom chart**.
3. Give it a **Name** — a live preview appears as you fill in the rest of the form.
4. Choose a **Chart type**: Bar, Line, Donut, or Progress.
5. Choose which **Transactions** to include: All, Income, Expense, or Card.
6. Optionally narrow it down to specific **Categories**.
7. Choose how to **Group by**: Month, Category, or Card (not available for Progress charts; Donut charts can't group by Month).
8. Choose a **Metric**: Sum, Count, or Average.
9. Choose a **Date range**: 3 months, 6 months, 12 months, this month, this year, or all time.
10. For Progress charts, set a **Target amount** to track your total against.
11. Pick a **Color** (skipped when grouping by Category, since each category already has its own color).
12. Tap **Create chart**.

### Chart types, at a glance

| Type     | Best for                                             |
| -------- | ----------------------------------------------------- |
| Bar      | Comparing values across months, categories, or cards |
| Line     | Trends over time                                     |
| Donut    | Share of a total (e.g. spending by category)         |
| Progress | Tracking a running total against a target             |

### Managing custom charts

Custom charts appear in the same Customise sheet as built-in sections, with their own **Edit** (pencil) and **Delete** (trash) icons alongside the usual show/hide and reorder controls.

---

## Custom Categories

### Adding a Custom Category

1. Go to **Profile → Manage Categories** (or **Account → Manage categories** on desktop), or tap **+ Add** inside the Add Transaction form.
2. Enter a name (max 28 characters), pick an icon, and choose a colour.
3. Select **Income** or **Expense**.
4. Tap **Save**.

Custom categories appear alongside the built-in defaults in all transaction and budget screens. You can edit or delete custom categories, but built-in defaults cannot be removed — **Savings & Investments** and **Fixed Income** specifically are protected, since other calculations depend on them existing.

> **Note:** The default category list was refreshed in July 2026. Accounts created before that keep the original set (Loan Repayment, House Rent, Utilities, and so on); newer accounts start with a refreshed set (Food & Dining, Transport, Shopping, and so on). Either way, you're free to add, rename, or remove your own categories.

---

## Recurring Bill Reminders

### Adding a Reminder

1. Open **Profile → Recurring Reminders → Add reminder**.
2. Enter a **label** (e.g. "Electricity Bill"), an optional **estimated amount**, and the **day of the month** it's due (1–28).
3. Optionally attach an expense **category** for automatic dismissal.

### Auto-dismiss vs. manual dismiss

If a reminder has a category attached, logging any transaction in that category during the month automatically satisfies it — it drops off your notifications without any extra step. Without a category, dismiss it yourself from the Notifications panel by tapping its checkmark.

### Editing

There's currently no in-place edit — delete the reminder and add a new one with the updated details.

> **Note:** Recurring Reminders is reachable from the mobile/tablet **Profile** page. It isn't currently exposed in the desktop **Account** panel.

---

## Settings & Account

On phone or tablet, tap **Profile** in the bottom bar. On desktop, tap your **avatar** (top-right) to open **Account**.

| Option              | Profile (mobile/tablet) | Account (desktop) |
| -------------------- | ------------------------ | ------------------ |
| Account info         | ✅ Email, member-since date | ✅ Same |
| Help & user guide    | ✅ | ✅ |
| Manage Categories    | ✅ | ✅ |
| Recurring Reminders  | ✅ | ❌ Not available |
| Currency             | ✅ | ✅ |
| Privacy & Security   | ✅ | ✅ |
| Contact Support      | ✅ WhatsApp link | ✅ Same |
| Sign Out             | ✅ | ✅ |

---

## Tips

- Record monthly card bills as **Card Payment** — not as an expense — so the app doesn't double-count it.
- Record items bought on credit as **Card Purchase**, not as a plain expense.
- When setting up an installment plan, create it at the time of purchase. The app pre-fills all future months immediately so your balance and budget reflect the full commitment right away.
- Check the **bell icon** at the start of each month to review installment payments due and any recurring reminders.
- Set a **Fixed Plan** first, then use **Month Overrides** for unusual months (holidays, big purchases, etc.).
- Review **Insights** at month-end to compare plan vs. actual and spot overspending categories.
- The **Cash in Hand** figure in Insights is cumulative across all time — useful for tracking your overall financial trajectory.
- Backfill an investment's historical values with their real dates instead of only entering today's value — the Value Over Time and Net Worth Trend charts are more useful with real history behind them.
- If you catch yourself mentally tracking something (like spending in one category against a yearly cap), turn it into a custom Progress chart instead — it'll sit on your Insights tab and update itself.

---

## Currency

Choose from 12 supported currencies in Profile (mobile/tablet) or Account (desktop). Your selection is saved per account and applies instantly everywhere in the app:

| Symbol | Code | Currency           |
| ------ | ---- | ------------------ |
| Rs.    | LKR  | Sri Lankan Rupee   |
| $      | USD  | US Dollar          |
| A$     | AUD  | Australian Dollar  |
| €      | EUR  | Euro               |
| £      | GBP  | British Pound      |
| S$     | SGD  | Singapore Dollar   |
| ₹      | INR  | Indian Rupee       |
| ¥      | JPY  | Japanese Yen       |
| C$     | CAD  | Canadian Dollar    |
| CHF    | CHF  | Swiss Franc        |
| NZ$    | NZD  | New Zealand Dollar |
| RM     | MYR  | Malaysian Ringgit  |

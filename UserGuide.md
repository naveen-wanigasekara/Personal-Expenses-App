# Personal Expense Finance App

A mobile-first personal finance tracker for Sri Lanka (LKR), with income/expense tracking, credit card management, budgeting, and insights.

---

## Getting Started

### Sign Up & Log In

1. Open the app and tap **Sign Up** (new user) or **Sign In** (existing user).
2. Enter your email and password. After signing up, confirm your account via the email you receive.
3. Your data syncs to the cloud automatically — accessible from any device.

> **Tip:** When prompted, install the app to your home screen for a native app experience (PWA).

---

## Navigation

Four tabs at the bottom of the screen:

| Tab | Purpose |
|-----|---------|
| **Insights** | Dashboard — summaries, charts, and breakdowns |
| **Ledger** | Full transaction history |
| **Cards** | Credit card management |
| **Budget** | Income targets and spending limits |

The **+ button** (floating action button) opens the Add Transaction form from any screen.

---

## Adding a Transaction

### 1. Select a type

| Type | When to use |
|------|-------------|
| **Expense** | Cash or bank debit purchase |
| **Income** | Salary, bonus, passive income, etc. |
| **Card Purchase** | Something bought on credit |
| **Card Payment** | Paying off your credit card bill |
| **Card Interest** | Interest or fees charged by the bank |

### 2. Enter the amount
Type the amount in Rs. The field formats automatically with commas.

### 3. Select a card *(card transactions only)*
Pick which credit card from the visual card selector.

### 4. Select a category
Tap a category from the grid. Tap **+ Add** to create a custom category on the fly.

### 5. Optional details
- **Note** — short description (e.g., "Lunch with client")
- **Date** — defaults to today; tap to change

Tap **Record** to save.

> **Important:** Use **Card Payment** to record paying your credit card bill — this reduces your card balance and is **not** counted as a new expense.

---

## Ledger Tab

### Viewing Transactions
Transactions are grouped by date with a daily subtotal per group. Each entry shows the category icon, description, and amount:
- `+` green = income
- `−` red = expense
- Card transactions show a card name badge

### Filtering
Use the dropdowns at the top to filter by **month**, **transaction type**, or **category**. The filter bar shows how many transactions match (e.g., "12 of 45").

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

| Utilization | Status |
|-------------|--------|
| Below 70% | Normal |
| 70–90% | Warning (yellow) |
| Above 90% | Danger (red) |

### Card Detail
Tap a card to view this month's purchases, payments, and interest charges; the full activity list; and edit/delete options.

> Deleting a card does **not** delete its linked transactions.

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

| Bar colour | Meaning |
|------------|---------|
| Green | Within budget |
| Yellow | Above 80% of budget |
| Red | Over budget |

Tap **Save** to apply changes.

> **Tip:** Tap **Copy Fixed Plan** to pre-fill the current month with your default values, then adjust as needed.

---

## Insights Tab

Use **← →** to navigate between months.

### Top Summary
- **Net Balance** — income minus expenses for the selected month
- **Income vs. Expenses** — totals at a glance
- **Card Debt Summary** — total debt and overall utilization across all cards

### Plan vs. Actual
Compares your budgeted plan to what actually happened: income target vs. actual, expense budget vs. actual, and planned vs. actual savings.

### Cashflow Chart
A 3-month bar chart showing income and expenses side by side, with budget target lines overlaid.

### Income Breakdown — "Where it came from"
Each income category shows total received, percentage of total income, and (if budgeted) progress toward the income target.

### Expense Breakdown — "Where it went"
Each expense category shows total spent, percentage of total spending, and (if budgeted) a progress bar vs. the limit — turns red when over budget.

---

## Custom Categories

### Adding a Custom Category
1. Go to **Settings → Manage Categories**, or tap **+ Add** inside the Add Transaction form.
2. Enter a name (max 28 characters), pick an icon, and choose a colour.
3. Select **Income** or **Expense**.
4. Tap **Save**.

Custom categories appear alongside the built-in defaults in all transaction and budget screens. You can edit or delete custom categories, but built-in defaults cannot be removed.

---

## Settings & Account

Tap your **avatar (your initial)** in the top-right of the Insights tab.

| Option | Description |
|--------|-------------|
| Account info | Your email and member-since date |
| Manage Categories | Add, edit, or delete custom categories |
| Contact Support | Opens a WhatsApp support link |
| Sign Out | Logs you out of the app |

---

## Tips

- Record monthly card bills as **Card Payment** — not as an expense — so the app doesn't double-count it.
- Record items bought on credit as **Card Purchase**, not as a plain expense.
- Set a **Fixed Plan** first, then use **Month Overrides** for unusual months (holidays, big purchases, etc.).
- Review **Insights** at month-end to compare plan vs. actual and spot overspending categories.
- The **running balance** in Insights is cumulative across all time — useful for tracking your overall financial trajectory.

---

## Currency

All amounts are in **Sri Lankan Rupees (Rs. / LKR)**. Large numbers display in compact form (e.g., Rs. 1.2M).

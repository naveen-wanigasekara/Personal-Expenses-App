export const HELP_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    items: [
      { q: "Signing up & logging in", a: "Tap Sign Up (new user) or Sign In (existing user). Enter your email and password. After signing up, confirm your account via the email you receive. Your data syncs to the cloud automatically — accessible from any device." },
      { q: "Installing the app", a: "When prompted, install the app to your home screen for a native experience. Tap the Install banner at the top of the screen and follow your device's prompt." },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    icon: "🧭",
    items: [
      { q: "What are the four tabs?", a: "Insights — your financial dashboard with summaries and charts.\nLedger — full transaction history.\nCards — credit card management.\nBudget — income targets and spending limits." },
      { q: "How do I add a transaction quickly?", a: "Tap the + button (floating action button) from any screen to open the Add Transaction form." },
    ],
  },
  {
    id: "transactions",
    title: "Adding Transactions",
    icon: "💳",
    items: [
      { q: "What transaction types are there?", a: "Expense — cash or bank debit purchase.\nIncome — salary, bonus, passive income, etc.\nCard Purchase — something bought on credit.\nCard Payment — paying off your credit card bill.\nCard Interest — interest or fees charged by the bank." },
      { q: "How do I record a card purchase?", a: "Tap +, choose Card Purchase, enter the amount, select which card was used, then pick a category. This adds to your card balance and counts as an expense in that category." },
      { q: "How do I record paying my credit card bill?", a: "Tap +, choose Card Payment, enter the amount paid, and select the card. This reduces your card balance — it is NOT counted as a new expense, so it won't inflate your spending totals." },
      { q: "What is the Note field for?", a: "An optional short description for the transaction, e.g. \"Lunch with client\" or \"Monthly salary\". It appears in the transaction list." },
    ],
  },
  {
    id: "ledger",
    title: "Ledger Tab",
    icon: "📋",
    items: [
      { q: "How are transactions displayed?", a: "Transactions are grouped by date with a daily subtotal. Each entry shows the category icon, description, and amount. Green + = income, red − = expense. Card transactions show a card name badge." },
      { q: "How do I filter transactions?", a: "Use the three dropdowns at the top to filter by month (last 6 months), transaction type (All, Income, Cash Purchase, Card Purchase), or category. The bar shows how many transactions match." },
      { q: "How do I delete a transaction?", a: "Tap the transaction row to expand it, then tap the delete icon that appears." },
    ],
  },
  {
    id: "cards",
    title: "Cards Tab",
    icon: "💳",
    items: [
      { q: "How do I add a credit card?", a: "Tap + Add Card and fill in the card name (e.g. \"AMEX Gold\"), credit limit, opening balance (any existing debt when you start), and choose a colour theme." },
      { q: "What does the utilization bar show?", a: "It shows your current balance as a percentage of your credit limit. Below 70% is normal, 70–90% shows a yellow warning, and above 90% shows a red danger indicator." },
      { q: "What can I see in Card Detail?", a: "Tap any card to see this month's total purchases, payments, and interest; a full activity list; and edit/delete options for the card." },
      { q: "What happens if I delete a card?", a: "Deleting a card removes the card record but does NOT delete its linked transactions. Those transactions remain in the Ledger." },
    ],
  },
  {
    id: "budget",
    title: "Budget Tab",
    icon: "🎯",
    items: [
      { q: "What is the Fixed Plan?", a: "Your default budget that applies automatically to every month. Set it once and it repeats. Use it for your regular monthly income targets and spending limits." },
      { q: "What is a Month Override?", a: "A custom budget for a specific month that overrides the Fixed Plan without changing it. Useful for unusual months like holidays or large one-off purchases." },
      { q: "How do I set income targets?", a: "In the Budget tab, enter a total expected income for the month and break it down per category (e.g. Rs. 150,000 from Fixed Income)." },
      { q: "How do I set expense budgets?", a: "Enter a total spending limit and per-category limits (e.g. Rs. 30,000 for Groceries). The Planned Savings summary shows: Income Target − Expense Budget." },
      { q: "What do the budget progress bar colours mean?", a: "Green — within budget. Yellow — above 80% of budget. Red — over budget." },
      { q: "What is Copy Fixed Plan?", a: "Tap this button to pre-fill the current month with your Fixed Plan values. You can then adjust individual categories for that month without affecting the fixed default." },
    ],
  },
  {
    id: "insights",
    title: "Insights Tab",
    icon: "📊",
    items: [
      { q: "What does the top summary show?", a: "Net This Month — income minus expenses for the selected month. Income vs. Expenses — totals at a glance. Cash in Hand — your actual available cash balance. Card Debt Summary — total debt and utilization across all cards." },
      { q: "What is Cash in Hand?", a: "The cumulative cash actually available to you. It adds up all income and subtracts cash expenses and card payments — but does NOT subtract card purchases, since no cash leaves your hand when you buy on credit. Paying off your card does reduce it, because that cash goes to the bank." },
      { q: "What is Plan vs. Actual?", a: "A comparison of your budgeted plan against what actually happened: income target vs. actual income, expense budget vs. actual spending, and planned vs. actual savings." },
      { q: "What is the Cashflow Chart?", a: "A 3-month bar chart showing income and expenses side by side, with budget target lines overlaid. Use the ← → arrows to navigate between months." },
    ],
  },
  {
    id: "categories",
    title: "Custom Categories",
    icon: "🏷️",
    items: [
      { q: "How do I add a custom category?", a: "Go to Account → Manage categories. Enter a name (max 28 characters), pick an icon and colour, then choose Income or Expense." },
      { q: "Can I delete built-in categories?", a: "No. The built-in defaults (e.g. Groceries, Fixed Income) cannot be removed. You can only edit or delete custom categories you've created." },
    ],
  },
  {
    id: "tips",
    title: "Tips & Best Practices",
    icon: "💡",
    items: [
      { q: "Avoid double-counting card spending", a: "Always use Card Purchase (not Expense) when buying something on credit, and Card Payment (not Expense) when paying your bill. This keeps your card balance and expense totals accurate." },
      { q: "Getting the most from budgets", a: "Set a Fixed Plan first to establish your baseline. Then use Month Overrides for unusual months. Review Insights at month-end to compare plan vs. actual and spot overspending categories." },
      { q: "Changing your currency", a: "Tap your avatar (top-right on Insights) to open Account settings. Tap the Currency row to pick from 12 supported currencies (LKR, USD, AUD, EUR, GBP, and more). Your choice is saved per account and applies instantly across the entire app." },
      { q: "Number formatting", a: "Large numbers display in compact form, e.g. 1.2M or 450K. Numbers are formatted automatically — just type digits and the app handles the rest." },
    ],
  },
];

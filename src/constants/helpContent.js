export const HELP_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    items: [
      {
        q: "Signing up & logging in",
        a: "Tap Sign Up (new user) or Sign In (existing user). Enter your email and password. After signing up, confirm your account via the email you receive. Your data syncs to the cloud automatically — accessible from any device.",
      },
      {
        q: "Installing the app",
        a: "When prompted, install the app to your home screen for a native experience. Tap the Install banner at the top of the screen and follow your device's prompt.",
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    icon: "🧭",
    items: [
      {
        q: "What are the tabs at the bottom?",
        a: "The bottom bar has four tabs and a central action button.\nInsights — your financial dashboard with summaries, charts, and notifications.\nLedger — full transaction history with filters.\nCards — credit card management and installment plans.\nBudget — income targets and spending limits.\nThe teal circle in the centre is the New Entry button.",
      },
      {
        q: "How do I add a new transaction?",
        a: "Tap the teal New button in the centre of the bottom navigation bar. It is raised above the bar and glows green so it is easy to spot. The button is available on all four tabs.",
      },
      {
        q: "Why does the bottom bar disappear sometimes?",
        a: "The navigation bar and New button automatically hide whenever a popup or form is open, so the screen stays uncluttered. They reappear as soon as you close the popup.",
      },
    ],
  },
  {
    id: "transactions",
    title: "Adding Transactions",
    icon: "💳",
    items: [
      {
        q: "What transaction types are there?",
        a: "Expense — cash or bank debit purchase.\nIncome — salary, bonus, passive income, etc.\nCard Purchase — something bought on credit.\nCard Payment — paying off your credit card bill.\nCard Interest — interest or fees charged by the bank.",
      },
      {
        q: "How do I record a card purchase?",
        a: "Tap the New button in the navigation bar, choose Card Purchase, enter the amount, select which card was used, then pick a category. This adds to your card balance and counts as an expense in that category.",
      },
      {
        q: "How do I record paying my credit card bill?",
        a: "Tap the New button in the navigation bar, choose Card Payment, enter the amount paid, and select the card. This reduces your card balance — it is NOT counted as a new expense, so it won't inflate your spending totals.",
      },
      {
        q: "What is Split into Installments?",
        a: "When adding a Card Purchase, you can toggle Split into Installments to break a large purchase into equal monthly payments. Enter a plan label (e.g. \"iPhone 16\"), the number of months, and the start month. The app pre-creates all monthly charge transactions automatically — so your card balance reflects the full amount immediately, but each month's Ledger and budget only shows that month's installment. Each installment transaction displays a badge (e.g. 2/12) showing which payment in the plan it is. You can view and cancel active plans from Card Detail.",
      },
      {
        q: "How do I record an installment payment to my bank?",
        a: "Record it as a regular Card Payment for the monthly installment amount. The installment plan tracks the charge side (what you owe the bank each month); a Card Payment records the cash you send to settle it. Both together give you an accurate picture of your card balance.",
      },
      {
        q: "What is the Note field for?",
        a: 'An optional short description for the transaction, e.g. "Lunch with client" or "Monthly salary". It appears in the transaction list as the primary label.',
      },
      {
        q: "Can I edit a transaction after saving it?",
        a: "Yes. In the Ledger or Card Detail, tap the transaction to expand it and tap Edit. The form opens pre-filled — update any field (type, amount, category, note, date, or card) and tap Save changes.",
      },
    ],
  },
  {
    id: "ledger",
    title: "Ledger Tab",
    icon: "📋",
    items: [
      {
        q: "How are transactions displayed?",
        a: "Transactions are grouped by date with a daily subtotal. Each entry shows the category icon, description, and amount. Green + = income, red − = expense. Card transactions show a card name badge. Installment transactions show a progress badge (e.g. 3/12).",
      },
      {
        q: "How do I filter transactions?",
        a: "Use the three dropdowns at the top to filter by month (last 6 months), transaction type (All, Income, Cash Purchase, Card Purchase), or category. The bar shows how many transactions match.",
      },
      {
        q: "How do I edit a transaction?",
        a: "Tap the transaction row to expand it, then tap Edit. The Add Transaction form opens pre-filled with the existing details — change any field and tap Save changes.",
      },
      {
        q: "How do I delete a transaction?",
        a: "Tap the transaction row to expand it, then tap Delete.",
      },
    ],
  },
  {
    id: "cards",
    title: "Cards Tab",
    icon: "💳",
    items: [
      {
        q: "How do I add a credit card?",
        a: 'Tap + Add Card and fill in the card name (e.g. "AMEX Gold"), credit limit, opening balance (any existing debt when you start), and choose a colour theme.',
      },
      {
        q: "What does the utilization bar show?",
        a: "It shows your current balance as a percentage of your credit limit. Below 70% is normal, 70–90% shows a yellow warning, and above 90% shows a red danger indicator.",
      },
      {
        q: "What can I see in Card Detail?",
        a: "Tap any card to view its details, including the current outstanding balance, this month's purchases, payments, and interest, active installment plans with progress bars, and a full activity list.",
        a: "The Current Outstanding Balance shown on each credit card in the Cards tab represents your total outstanding balance, including all active installment plans and any existing outstanding balance.",
        a: "After opening a card, the Current Outstanding Balance shown in Card Detail includes only the outstanding amounts up to the current month. Future scheduled installment charges are not included until their month arrives."
      },
      {
        q: "What are Active Plans in Card Detail?",
        a: "When you have installment plans running on a card, an Active Plans section appears at the top of Card Detail. Each plan shows the label, monthly amount, how many installments have been paid vs. the total, and a progress bar. You can cancel a plan from here.",
      },
      {
        q: "How do I cancel an installment plan?",
        a: "In Card Detail, find the plan under Active Plans and tap Cancel. Past installment transactions are kept exactly as they are. Future installments (months after the current one) are deleted and the card balance updates accordingly.",
      },
      {
        q: "Can I edit or delete transactions from Card Detail?",
        a: "Yes. Tap any transaction in the activity list to expand it, then tap Edit to modify it or Delete to remove it. Changes reflect immediately in your card balance and Insights.",
      },
      {
        q: "What happens if I delete a card?",
        a: "Deleting a card removes the card record but does NOT delete its linked transactions. Those transactions remain in the Ledger.",
      },
    ],
  },
  {
    id: "budget",
    title: "Budget Tab",
    icon: "🎯",
    items: [
      {
        q: "What is the Fixed Plan?",
        a: "Your default budget that applies automatically to every month. Set it once and it repeats. Use it for your regular monthly income targets and spending limits.",
      },
      {
        q: "What is a Month Override?",
        a: "A custom budget for a specific month that overrides the Fixed Plan without changing it. Useful for unusual months like holidays or large one-off purchases.",
      },
      {
        q: "How do I set income targets?",
        a: "In the Budget tab, enter a total expected income for the month and break it down per category (e.g. Rs. 150,000 from Fixed Income).",
      },
      {
        q: "How do I set expense budgets?",
        a: "Enter a total spending limit and per-category limits (e.g. Rs. 30,000 for Groceries). The Planned Savings summary shows: Income Target − Expense Budget.",
      },
      {
        q: "What do the budget progress bar colours mean?",
        a: "Green — within budget. Yellow — above 80% of budget. Red — over budget.",
      },
      {
        q: "What is Copy Fixed Plan?",
        a: "Tap this button to pre-fill the current month with your Fixed Plan values. You can then adjust individual categories for that month without affecting the fixed default.",
      },
      {
        q: "Do installment plans affect my budget?",
        a: "Yes. Since all monthly installment transactions are pre-created, future months will already show spending in the relevant category. This means the budget for that category will reflect upcoming installments automatically — helping you plan ahead and avoid overspending.",
      },
    ],
  },
  {
    id: "insights",
    title: "Insights Tab",
    icon: "📊",
    items: [
      {
        q: "What does the Insights tab show?",
        a: "Everything on the Insights tab is customisable. By default you see: Net This Month (income minus expenses), In (total income), Out (total expenses), Cash in Hand (cumulative available cash), and below those, Card Debt, Budget Progress, Plan vs. Actual, Cashflow chart, Income Breakdown, and Expense Breakdown. You can hide, show, or reorder any of these ten sections.",
      },
      {
        q: "What is the notification bell?",
        a: "The bell icon in the top-right of the Insights tab shows a red badge with the number of active notifications. Tap it to open the Notifications panel, which has two sections:\nInstallment Payments — installment plans that have a charge due this month, showing the plan name, card, current installment number (e.g. 3/12), and monthly amount.\nRecurring Bills — any recurring reminders set up for this month that haven't been addressed yet.",
      },
      {
        q: "What is Cash in Hand?",
        a: "The cumulative cash actually available to you. It adds up all income and subtracts cash expenses and card payments — but does NOT subtract card purchases, since no cash leaves your hand when you buy on credit. Paying off your card does reduce it, because that cash goes to the bank.",
      },
      {
        q: "How do I customise which sections appear?",
        a: "Tap the sliders icon in the top-right of the Insights tab to open the Customise sheet. All ten sections are listed — including Net This Month, In, Out, and Cash in Hand. Toggle any section on or off with the eye icon, and reorder them with the up/down arrows. Your layout is saved automatically. Tap Reset to default to restore the original order and visibility.",
      },
      {
        q: "What is Plan vs. Actual?",
        a: "A comparison of your budgeted plan against what actually happened: income target vs. actual income, expense budget vs. actual spending, and planned vs. actual savings.",
      },
      {
        q: "What is the Cashflow Chart?",
        a: "A 3-month bar chart showing income and expenses side by side, with budget target lines overlaid. Use the ← → arrows to navigate between months.",
      },
      {
        q: "What are the Income and Expense Breakdown sections?",
        a: "These show how much was earned or spent per category this month. If a category has a budget or target set, a progress bar shows how close you are, plus the amount remaining or over. Categories are sorted by amount spent, with over-budget ones highlighted at the top.",
      },
    ],
  },
  {
    id: "categories",
    title: "Custom Categories",
    icon: "🏷️",
    items: [
      {
        q: "How do I add a custom category?",
        a: "Go to Account → Manage categories. Enter a name (max 28 characters), pick an icon and colour, then choose Income or Expense.",
      },
      {
        q: "Can I delete built-in categories?",
        a: "No. The built-in defaults (e.g. Groceries, Fixed Income) cannot be removed. You can only edit or delete custom categories you've created.",
      },
    ],
  },
  {
    id: "tips",
    title: "Tips & Best Practices",
    icon: "💡",
    items: [
      {
        q: "Avoid double-counting card spending",
        a: "Always use Card Purchase (not Expense) when buying something on credit, and Card Payment (not Expense) when paying your bill. This keeps your card balance and expense totals accurate.",
      },
      {
        q: "Using installment plans effectively",
        a: "Create an installment plan at the time of purchase, not later. The app pre-fills all future months immediately, so your balance and budget reflect the full commitment right away. Use Card Detail to monitor progress and cancel plans early if you pay off the balance.",
      },
      {
        q: "Getting the most from budgets",
        a: "Set a Fixed Plan first to establish your baseline. Then use Month Overrides for unusual months. Review Insights at month-end to compare plan vs. actual and spot overspending categories.",
      },
      {
        q: "Checking upcoming commitments",
        a: "Tap the bell icon on the Insights tab at the start of each month to see installment payments due and any other reminders. This gives you a quick view of fixed outgoings before you start spending.",
      },
      {
        q: "Changing your currency",
        a: "Tap your avatar (top-right on Insights) to open Account settings. Tap the Currency row to pick from 12 supported currencies (LKR, USD, AUD, EUR, GBP, and more). Your choice is saved per account and applies instantly across the entire app.",
      },
      {
        q: "Number formatting",
        a: "Key amounts — Net this month, Cash in Hand, In, and Out — always display as full numbers (e.g. Rs. 87,800.00) so nothing is hidden at a glance. Compact K/M notation is used only in secondary places like chart labels and budget summaries where space is limited. When entering amounts, just type the digits and the app formats them automatically.",
      },
    ],
  },
];

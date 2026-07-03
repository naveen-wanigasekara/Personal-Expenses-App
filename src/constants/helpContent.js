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
        a: "The bottom bar has four destinations and a central action button.\nInsights — your financial dashboard with summaries, charts, and notifications.\nLedger — full transaction history with filters.\nCards — credit card management and installment plans.\nProfile — your account, the User Guide, categories, reminders, and currency.\nThe purple circle in the centre is the New Entry button.",
      },
      {
        q: "Where did Budget and Investments go?",
        a: "Tap the menu icon (three lines, top-left of any page) to open the slide-in menu. Budget and Investments live there, keeping the bottom bar focused on your four most-used destinations.",
      },
      {
        q: "How do I add a new transaction?",
        a: "Tap the purple New button in the centre of the bottom navigation bar. It is raised above the bar so it is easy to spot. The button is available from every tab.",
      },
      {
        q: "Why does the bottom bar disappear sometimes?",
        a: "The navigation bar and New button automatically hide whenever a popup or form is open, so the screen stays uncluttered. They reappear as soon as you close the popup.",
      },
      {
        q: "Does navigation look different on a bigger screen?",
        a: "On desktop and laptop, Insights, Ledger, Cards, Investments, and Budget are all shown directly in a sidebar — no menu needed. A persistent header also shows month navigation, notifications, and your account (tap your avatar for Account settings). Phones and tablets use the bottom bar and slide-in menu described above.",
      },
      {
        q: "I changed the month in one place — why did another page update too?",
        a: "There's a single month selector shared across the whole app. Change it from the top bar, or from inside any page (like a card's detail view), and every other page moves to that same month automatically.",
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
        a: "Tap the New button in the navigation bar, choose Card Payment, enter the amount paid, and select the card. This reduces your card balance — it is NOT counted as a new expense, so it won't inflate your spending totals. The amount field suggests your current outstanding balance automatically; double-check it after switching cards, since it updates to match whichever card is selected.",
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
      {
        q: "I deleted a transaction by mistake — can I get it back?",
        a: "Yes, for a few seconds. Deleting shows an Undo option at the bottom of the screen for about 5 seconds before the deletion is final. Tap it right away if you change your mind.",
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
        a: "Use the search bar and the dropdowns at the top to filter by month, transaction type (All, Income, Cash Purchase, CC Purchase), or category. The count shown updates to match.",
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
        a: "It shows your current balance as a percentage of your credit limit. Below 70% is normal, 70–90% shows a yellow warning, and above 90% shows a red danger indicator with a hint that high utilization can hurt your credit score.",
      },
      {
        q: "What can I see in Card Detail?",
        a: "Tap any card to view its details, including the Current Outstanding Balance, this month's purchases, payments, interest, active installment plans with progress bars, and a full activity list.\n\nThe Current Outstanding Balance shown on each credit card in the Cards tab represents your total outstanding balance, including all active installment plans and any existing outstanding balance.\n\nAfter opening a card, the Current Outstanding Balance shown in Card Detail includes only the outstanding amounts up to the current month. Future scheduled installment charges are not included until their month arrives."},
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
    id: "investments",
    title: "Investments Tab",
    icon: "📈",
    items: [
      {
        q: "How do I add an investment?",
        a: "Open the menu (top-left) and tap Investments, then + Add an investment. Enter a name, choose a type — Stocks, Mutual Fund, Fixed Deposit, Crypto, Real Estate, or Other — a starting amount, and a start date.",
      },
      {
        q: "How does a Fixed Deposit work?",
        a: "Choose Fixed Deposit as the type and you'll also enter an interest rate, a payout frequency (Monthly, Quarterly, Semi-Annually, Annually, or At Maturity), and a tenure in months. Unlike other investments, a Fixed Deposit's value doesn't grow on its own — interest is calculated and paid out separately each period, exactly like a real bank deposit. The detail view shows your next payout date and amount, and once the tenure ends, the total interest earned at maturity.",
      },
      {
        q: "How do I update an investment's value?",
        a: "Open the investment and tap Record value. Enter the current value and a date — even a date in the past. The investment's value always reflects whichever check-in has the latest date, so backfilling an earlier entry is safe. You can edit or delete any check-in except the last one remaining.",
      },
      {
        q: "What is the Value Over Time chart?",
        a: "Once an investment has two or more recorded values, a trend chart appears showing how its value has changed, along with the gain or loss since the first check-in.",
      },
      {
        q: "How is gain/loss calculated?",
        a: "Gain or loss is your current value minus what you originally put in. The return percentage is that gain divided by your initial amount. Both are shown on the investment detail page, and summed across your whole portfolio at the top of the Investments tab.",
      },
      {
        q: "What happens if I delete an investment?",
        a: "Deleting an investment also removes its full value history. This can't be undone.",
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
        a: "Everything on the Insights tab is customisable, including charts you build yourself (see Custom Charts). By default you see: Net This Month, In, Out, Cash in Hand, Total Savings, Card Debt, Total Investments, Net Worth Trend, Budget Progress, Plan vs. Actual, Cashflow, Income Breakdown, and Expense Breakdown. You can hide, show, or reorder any section — built-in or custom — from one Customise sheet.",
      },
      {
        q: "What is the notification bell?",
        a: "The bell icon in the top-right of every page shows a red badge with the number of active notifications. Tap it to open the Notifications panel, which has two sections:\nInstallment Payments — installment plans that have a charge due this month, showing the plan name, card, current installment number (e.g. 3/12), and monthly amount.\nRecurring Bills — any recurring reminders set up for this month that haven't been addressed yet.\nTap the checkmark on any notification to mark it as completed — it disappears from the list for the rest of the month, then reappears next month if it's still relevant.",
      },
      {
        q: "What is Cash in Hand?",
        a: "The cumulative cash actually available to you. It adds up all income and subtracts cash expenses and card payments — but does NOT subtract card purchases, since no cash leaves your hand when you buy on credit. Paying off your card does reduce it, because that cash goes to the bank.",
      },
      {
        q: "What is the Net Worth Trend?",
        a: "A 12-month chart of your cumulative cash balance — the same balance shown in Cash in Hand — plotted month by month so you can see whether it's trending up or down.",
      },
      {
        q: "What is Total Investments?",
        a: "The sum of your investment portfolio's latest known values, pulled straight from the Investments tab.",
      },
      {
        q: "How do I customise which sections appear?",
        a: "Tap the sliders icon in the top-right of the Insights tab to open the Customise sheet. Every section — built-in and any custom charts you've created — is listed. Toggle any section on or off with the eye icon, and reorder them with the up/down arrows. Your layout is saved automatically. Tap Reset to default to restore the original built-in sections — your custom charts stay put.",
      },
      {
        q: "What is Plan vs. Actual?",
        a: "A comparison of your budgeted plan against what actually happened: income target vs. actual income, expense budget vs. actual spending, and planned vs. actual savings.",
      },
      {
        q: "What is the Cashflow Chart?",
        a: "A 6-month bar chart showing income and expenses side by side, with budget target lines overlaid. Use the ← → arrows to navigate between months.",
      },
      {
        q: "What are the Income and Expense Breakdown sections?",
        a: "These show how much was earned or spent per category this month. If a category has a budget or target set, a progress bar shows how close you are, plus the amount remaining or over. Categories are sorted by amount spent, with over-budget ones highlighted at the top.",
      },
    ],
  },
  {
    id: "custom-charts",
    title: "Custom Charts",
    icon: "🎨",
    items: [
      {
        q: "How do I create a custom chart?",
        a: "On the Insights tab, tap the sliders icon to open Customise, then tap + Create custom chart. Give it a name, and a live preview appears as you fill in the rest of the form.",
      },
      {
        q: "What chart types are available?",
        a: "Bar — a column per month, category, or card.\nLine — best for trends over time.\nDonut — a ring showing each category or card's share of the total.\nProgress — a single number tracked against a target you set.",
      },
      {
        q: "How do I control what data the chart uses?",
        a: "Choose which transactions to include (All, Income, Expense, or Card), optionally narrow it to specific categories, then choose how to group it (Month, Category, or Card) and what to measure (Sum, Count, or Average). Finally, pick a date range — from 3 months up to all time.",
      },
      {
        q: "What is the target amount for?",
        a: 'Only Progress charts use it. Set a target number and the chart shows your current total as a bar and percentage against it — useful for tracking something like "spend under Rs. 20,000 on dining this year."',
      },
      {
        q: "Can I edit or delete a custom chart later?",
        a: "Yes. In the Customise sheet, your custom charts have their own edit (pencil) and delete (trash) icons alongside the show/hide and reorder controls every section has.",
      },
    ],
  },
  {
    id: "profile",
    title: "Profile & Account",
    icon: "👤",
    items: [
      {
        q: "Where are my account settings?",
        a: "On phone or tablet, tap Profile in the bottom bar. On desktop, tap your avatar in the top-right corner. Both show your account info and give you access to the User Guide, Manage Categories, Currency, and Sign out.",
      },
      {
        q: "Where do I manage recurring reminders?",
        a: "On phone or tablet, open Profile and tap Recurring Reminders. This isn't currently available from the desktop Account panel — use a phone- or tablet-sized window to manage reminders for now.",
      },
      {
        q: "How do I contact support?",
        a: "Open Profile (or Account on desktop) and tap Contact Support — it opens a WhatsApp chat.",
      },
      {
        q: "How do I sign out?",
        a: "Open Profile (or Account on desktop) and tap Sign out at the bottom.",
      },
    ],
  },
  {
    id: "reminders",
    title: "Recurring Bill Reminders",
    icon: "🔔",
    items: [
      {
        q: "How do I add a reminder?",
        a: 'Open Profile → Recurring Reminders → Add reminder. Enter a label (e.g. "Electricity Bill"), an optional estimated amount, and which day of the month it\'s due (1–28).',
      },
      {
        q: "Can reminders dismiss themselves automatically?",
        a: "Yes, if you attach a category to the reminder. As soon as you log any transaction in that category during the month, the reminder is treated as handled and drops off your notifications on its own. Without a category, you'll need to dismiss it yourself.",
      },
      {
        q: "How do I dismiss a reminder manually?",
        a: "Open the notification bell and tap the checkmark next to the reminder to mark it completed for the month.",
      },
      {
        q: "Can I edit a reminder?",
        a: "Not yet — delete it and add a new one with the updated details.",
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
        a: "Go to Profile (or Account) → Manage categories. Enter a name (max 28 characters), pick an icon and colour, then choose Income or Expense.",
      },
      {
        q: "Can I delete built-in categories?",
        a: "No. The built-in defaults cannot be removed — Savings & Investments and Fixed Income specifically can't even be renamed to something unrelated, since other calculations (like Total Savings) rely on them existing. You can freely edit or delete any custom category you've created.",
      },
      {
        q: "Why do my categories look different from someone else's?",
        a: "The default category list was refreshed in July 2026. Accounts created before that keep the original set (Loan Repayment, House Rent, Utilities, and so on); newer accounts start with a refreshed set (Food & Dining, Transport, Shopping, and so on). Either way, you're free to add, rename, or remove your own categories.",
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
        a: "Tap the bell icon at the start of each month to see installment payments due and any other reminders. This gives you a quick view of fixed outgoings before you start spending.",
      },
      {
        q: "Backfill investment values instead of guessing",
        a: "If you're setting up an investment you've held for a while, record a few historical value check-ins with their real dates rather than just today's value. The Value Over Time chart and your Net Worth Trend will both be more useful with real history behind them.",
      },
      {
        q: "Build a chart before you need it",
        a: "If you find yourself mentally tracking something — like spending in one category against a yearly cap — turn it into a custom Progress chart instead. It'll sit right on your Insights tab and update itself.",
      },
      {
        q: "Changing your currency",
        a: "Open Profile (phone/tablet) or Account (desktop) and tap the Currency row to pick from 12 supported currencies (LKR, USD, AUD, EUR, GBP, and more). Your choice is saved per account and applies instantly across the entire app.",
      },
      {
        q: "Number formatting",
        a: "Key amounts — Net this month, Cash in Hand, In, and Out — always display as full numbers (e.g. Rs. 87,800.00) so nothing is hidden at a glance. Compact K/M notation is used only in secondary places like chart labels and budget summaries where space is limited. When entering amounts, just type the digits and the app formats them automatically.",
      },
    ],
  },
];

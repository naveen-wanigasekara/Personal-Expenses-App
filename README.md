# Personal Expenses Tracker

> A modern personal expense tracker — record income, expenses, credit cards, investments, and budgets with a beautiful dark UI, cloud sync, and end-to-end encryption.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ecf8e.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8.svg)

A mobile-first personal finance app that helps you record every transaction in and out, plan a monthly budget, track credit card debt without double-counting, follow an investment portfolio (including real Fixed Deposit payout math), and see exactly where your money goes — with fully customizable dashboards, right down to charts you build yourself — across devices, in real time. All your financial data is end-to-end encrypted before it ever reaches the database. Install it to your phone's home screen like a native app.

---

## Features

### 💰 Track everything

- **Income** across 6 built-in categories (Fixed Income, Emergency Funds, Passive Income, Bonus & Rewards, Refunds & Reimbursements, Other Income)
- **Expenses** across 12 built-in categories (Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Travel, Gifts & Donations, Personal Care, Card Interest & Fees, Savings & Investments, Miscellaneous — accounts created before the July 2026 category refresh keep the original set: Loan Repayment, House Rent, Utilities, Groceries, Healthcare, Transport & Vehicle, Shopping & Household, Entertainment & Dining, Insurance & Premiums, Card Interest & Fees, Savings & Investments, Other Expenses)
- **Credit cards** as full debt accounts with limits, balances, and utilization tracking
- **Investments** — stocks, mutual funds, crypto, real estate, or fixed deposits, with value history and gain/loss tracking (see below)
- **Custom categories** — add your own expense or income categories with a name, icon, and colour; edit or delete them at any time (the two protected categories — Savings & Investments, Fixed Income — can't be deleted, since Total Savings and other calculations depend on them existing)

### 🎯 Plan with intent

- **Fixed plan** — set your default monthly income targets and expense budgets once, applied automatically every month
- **Per-month overrides** — adjust the plan for special months (bonuses, holidays) without touching your defaults
- **Per-category targets** for both income and expenses, not just an overall total
- Copy your fixed plan to any month as a starting point and tweak from there
- See planned savings calculated live as you allocate

### 📊 Insights that matter

- **Plan vs. Actual** — track progress toward both income targets and spending limits
- **Where it went** — every budgeted expense category shown with remaining balance, even unspent ones, plus a month-over-month delta and a daily spending-pace hint for categories running over
- **Where it came from** — income breakdown by source with target tracking
- **Cashflow chart** — 6-month bar chart with budget target lines overlaid
- **Net Worth Trend** — 12-month cumulative cash balance chart
- **Cash in Hand** — true available cash balance (adds income, subtracts cash expenses and card payments; ignores card purchases that haven't been paid off yet)
- **Total Investments** — sum of your portfolio's latest known values
- **Credit health** — total debt, available credit, and utilization warnings (≥70% warn, ≥90% danger)
- **Fully customizable** — show, hide, and reorder every section (built-in or your own custom charts, see below) from one Customize sheet
- **Notification bell** — badge-counted bell icon in the header; opens a panel showing installment payments due this month and any active recurring bill reminders, each with a **Mark as completed** action that dismisses it for the current month only — it reappears next month if the underlying plan or reminder is still active

### 💳 Honest credit card tracking

Three transaction types designed to avoid double-counting:

- **Card Purchase** — adds to card balance and counts as an expense in its category
- **Card Payment** — reduces card balance, _not_ a new expense (the spending was already recorded when you bought something)
- **Card Interest & Fees** — adds to balance and counts as a real cost

### 📆 Installment plans

Split a large card purchase into equal monthly payments:

- Toggle **Split into Installments** when adding a Card Purchase — enter the plan label, number of months, and start month
- The full outstanding amount is reflected in the card balance immediately; each month's Ledger shows only that month's installment
- An installment badge (e.g. **3/12**) appears on every transaction row linked to a plan
- Active plans are visible in **Card Detail** with a progress bar and elapsed/remaining months
- Cancel a plan at any time — past installments are preserved, future ones are removed and the balance updates accordingly
- Installment charges flow through the budget system like any card purchase, so future months show the committed spending automatically

### 📈 Investment portfolio tracking

- Track **Stocks, Mutual Funds, Fixed Deposits, Crypto, Real Estate**, or anything else under **Other**
- **Fixed Deposits** model real FD behavior, not simple growth: set an interest rate, payout frequency (Monthly, Quarterly, Semi-Annually, Annually, or At Maturity), and tenure — the principal stays flat and interest is calculated and paid out separately each period, exactly like a real bank FD, with a computed maturity date and a warning if the chosen frequency doesn't fit the tenure
- **Value check-ins** for every investment — record a current value at any date (even backfilled); the investment's live value always reflects whichever check-in has the latest date, and any check-in can be edited or deleted (except the only one on record)
- A **Value Over Time** trend chart appears once an investment has two or more check-ins, with gain/loss and return % shown alongside
- Portfolio summary shows total invested, current value, and overall gain/loss across everything; **Total Investments** appears as its own section on Insights

### 🔔 Recurring bill reminders

Set up a reminder for anything that repeats every month — a label, an optional estimated amount, and which day it's due. Attach an expense category and the reminder auto-dismisses itself for the month the moment you log a matching transaction; leave it uncategorized and dismiss it manually from the Notifications panel instead.

### 🎨 Build your own charts

Beyond the built-in Insights sections, create fully custom charts from your own transaction data — no coding, just a form:

- Choose a **Bar, Line, Donut, or Progress** chart
- Filter by transaction type (All, Income, Expense, or Card) and by specific categories
- Group by Month, Category, or Card, with Sum, Count, or Average as the metric
- Pick a date range — 3, 6, or 12 months, this month, this year, or all time
- Progress charts track a running total against a target you set
- A live preview updates as you configure it, before you save anything
- Custom charts appear right alongside the built-in sections in the same Customize sheet — reorder, hide, edit, or delete them exactly like any other section

### 🌍 Multi-currency support

Choose from 12 currencies in the Account settings — the selection is saved per account and applies instantly everywhere:

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

### 🔒 Client-side encryption at rest

All user-entered financial data — transaction amounts, categories, notes, dates; card names, limits, balances; budget totals and category breakdowns — is encrypted with **AES-GCM-256** in the browser before being sent to Supabase, using a key derived from your user ID and a shared secret via PBKDF2 (100,000 iterations, SHA-256). Raw financial values are never stored in plaintext.

**Known limitation:** because `VITE_ENCRYPTION_SECRET` is bundled into the public client JS (it's not a real server-side secret — anyone can extract it from the deployed app), this encryption does not provide meaningful confidentiality against an attacker who has both the database and the app's source, since the key can be re-derived from a row's own `user_id` column. In practice, **Supabase's Row-Level Security policies are the actual access boundary** between users, not the encryption layer. This is a legitimate weakness worth being aware of if you're evaluating this app for genuinely sensitive data; a real fix would derive the key from a user-supplied passphrase instead (requiring a migration path for existing data) and is tracked as a future improvement rather than something patched in-place.

### 🧭 Navigation that adapts to your screen

- **Mobile/tablet**: a 5-item bottom bar (Insights, Ledger, **+ New**, Cards, Profile) plus a slide-in menu — tap the hamburger icon in any page's header — for Budget and Investments
- **Desktop**: a full sidebar with all six destinations always visible (Insights, Ledger, Cards, Investments, Budget), plus a persistent header with month navigation, notifications, and account access
- **Profile** (mobile/tablet) and **Account** (desktop) both give you account info, the User Guide, Manage Categories, Currency, privacy info, support, and sign out — note that Recurring Reminders is currently only reachable from the mobile/tablet Profile page, not from the desktop Account panel
- A single month selector stays in sync everywhere — change it from the top bar or from inside any page (e.g. a card's detail view) and every view updates together

### 📱 Installable anywhere

- Full Progressive Web App (PWA) — install directly from your browser to any phone's home screen
- Works on iOS, Android, Windows, macOS, and Linux
- Offline-capable with smart caching of fonts, assets, and recent data
- No app store, no platform fees, one codebase

### 🔐 Account security

- Email + password authentication via Supabase Auth
- Forgot password flow sends a reset link by email
- Row-Level Security ensures each user's rows are inaccessible to all other users at the database level
- Cloud sync across phone, tablet, and desktop
- Optimistic UI — changes appear instantly, then persist in the background

---

## Tech stack

| Layer      | Tech                                      |
| ---------- | ----------------------------------------- |
| Frontend   | React 18, Vite 5                          |
| Database   | PostgreSQL (via Supabase)                 |
| Auth       | Supabase Auth (email + password)          |
| Encryption | Web Crypto API — AES-GCM-256, PBKDF2      |
| PWA        | vite-plugin-pwa (Workbox)                 |
| Icons      | Lucide React                              |
| Typography | PT Serif + Source Sans 3 + JetBrains Mono |
| Styling    | Vanilla CSS with CSS custom properties    |

No framework lock-in, no UI component library — clean React split across purpose-built modules under `src/`.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/personal-expenses-tracker.git
cd personal-expenses-tracker
npm install

# 2. Set up Supabase (see SETUP.md for full walkthrough)
#    - Create a free Supabase project
#    - Run db/schema.sql in the Supabase SQL Editor

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — paste your Supabase credentials and generate an encryption secret

# 4. Run locally
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and create your account.

**For the full setup walkthrough including Supabase configuration and deployment**, see **[SETUP.md](./SETUP.md)**.

---

## Installing as a PWA

Once deployed, install the app directly to your device:

- **Android (Chrome/Edge)**: Tap the menu → "Install app" or "Add to Home screen"
- **iOS (Safari)**: Tap the Share button → "Add to Home Screen"
- **Desktop (Chrome/Edge)**: Click the install icon in the address bar

The app runs in standalone mode (no browser chrome), works offline, and launches instantly.

---

## Screenshots

> Add screenshots of the Insights, Ledger, Cards, and Budget tabs here once deployed.

---

## Project structure

```
personal-expenses-tracker/
├── src/
│   ├── main.jsx                  Entry point — mounts React, imports CSS
│   ├── App.jsx                   Root auth gate with crypto init
│   ├── context.js                CurrencyCtx React context
│   ├── styles/
│   │   └── app.css               All styles (CSS custom properties + components)
│   ├── lib/
│   │   ├── supabase.js           Supabase client + encrypted data API
│   │   └── crypto.js             AES-GCM-256 encryption (Web Crypto API)
│   ├── hooks/
│   │   └── usePWA.js             PWA install prompt + update hook
│   ├── constants/
│   │   ├── categories.js         Built-in expense/income categories + icon map (two expense sets, gated by signup date)
│   │   ├── currencies.js         Supported currencies + card colour palettes
│   │   └── helpContent.js        Help & Guide section data
│   ├── utils/
│   │   ├── format.js             fmt, fmtCompact, monthKey, monthLabel, emptyPlan
│   │   ├── storage.js            localStorage helpers (custom categories, currency, Insights layout, custom charts, completed notifications)
│   │   ├── investmentCalc.js     Fixed Deposit maturity/payout math
│   │   └── chartData.js          Aggregation pipeline for custom charts (filter → group → metric)
│   └── components/
│       ├── MainApp.jsx           Authenticated shell — all state, data loading
│       ├── DashView.jsx          Insights tab (cashflow, plan vs actual, categories, Customize sheet)
│       ├── HomeView.jsx          Ledger tab (grouped transactions + filters)
│       ├── BudgetView.jsx        Budget tab (fixed plan + monthly overrides)
│       ├── CardsView.jsx         Cards tab (list + summary)
│       ├── CardDetailView.jsx    Individual card detail + activity
│       ├── InvestmentsView.jsx   Investments tab (portfolio list + summary)
│       ├── InvestmentDetailView.jsx Individual investment detail, FD payouts, value history
│       ├── InvestmentFormModal.jsx Add/edit investment form
│       ├── InvestmentTile.jsx    Investment visual tile component
│       ├── InvestmentValueModal.jsx Record/edit a value check-in
│       ├── AddModal.jsx          Add transaction bottom sheet (+ installment toggle)
│       ├── CardFormModal.jsx     Add/edit card bottom sheet
│       ├── CardTile.jsx          Card visual tile component
│       ├── CategoriesModal.jsx   Manage categories sheet
│       ├── CategoryFormModal.jsx Add/edit category form
│       ├── ChartFormModal.jsx    Custom chart builder (with live preview)
│       ├── charts/               Shared chart mark components (Bar, Line, Donut, Progress) + CustomChartCard renderer
│       ├── Sheet.jsx              Shared modal chrome (bottom sheet on mobile, centered dialog on desktop)
│       ├── NavDrawer.jsx         Mobile/tablet slide-in menu (Budget + Investments)
│       ├── UserView.jsx          Profile tab (mobile/tablet) — account, guide, categories, reminders, currency
│       ├── SettingsModal.jsx     Desktop Account modal (currency, categories, sign out)
│       ├── HelpModal.jsx         Help & Guide accordion modal
│       ├── NotificationsPanel.jsx Notifications bottom sheet (installments + reminders, mark-as-completed)
│       ├── RecurringRemindersModal.jsx Recurring bill reminders management
│       ├── AuthScreen.jsx        Sign in / sign up / forgot password
│       ├── TxRow.jsx             Single transaction row (expandable, installment badge)
│       ├── AmountInput.jsx       Formatted numeric input
│       ├── NavBtn.jsx            Bottom nav button
│       └── PWABanners.jsx        Install + update banners
├── db/
│   ├── schema.sql                Database tables + RLS policies
│   └── schema_migration.sql     One-time migration for existing deployments
├── public/                       Icons, favicon, screenshots (PWA assets)
├── index.html                    HTML shell with PWA meta tags
├── vite.config.js                Vite + PWA plugin configuration
├── package.json
├── .env.example                  Environment variable template
├── SETUP.md                      Step-by-step setup & deployment guide
└── README.md                     You are here
```

---

## Database schema

Eight tables, all secured with Row-Level Security:

- **`transactions`** — income, expenses, card purchases, card payments, and card interest. Encrypted columns: `amount`, `category`, `note`, `date`. Plain `installment_id` links transactions to a plan.
- **`cards`** — credit card accounts with limits and opening balances. Encrypted columns: `name`, `credit_limit`, `opening_balance`, `colors`.
- **`budgets`** — monthly plans (`month_key = 'fixed'` for the default; `'2026-04'` for overrides). Encrypted columns: `income_total`, `income_categories`, `expense_total`, `expense_categories`.
- **`installment_plans`** — credit card installment plans; one row per plan, `active` boolean, never deleted on cancellation. Encrypted columns: `label`, `total_amount`, `monthly_amount`, `total_months`, `start_month`, `category`.
- **`recurring_reminders`** — user-defined recurring bill reminders; `active` boolean, optional `category` for auto-dismiss logic. Encrypted columns: `label`, `amount`, `day_of_month`, `category`.
- **`investments`** — investment holdings (stocks, funds, crypto, real estate, fixed deposits). Encrypted columns: `name`, `type`, `initial_amount`, `current_value`, `start_date`, `notes`, plus `interest_rate`, `payout_frequency`, `tenure_months` for Fixed Deposits.
- **`investment_valuations`** — dated value check-ins for an investment; plain `investment_id` (no foreign key/cascade — the app cleans these up itself when an investment is deleted). Encrypted columns: `value`, `recorded_date`.
- **`user_settings`** — one row per user for everything that used to be localStorage-only: custom categories, currency, Insights layout, and custom charts. Each column is upserted independently so, e.g., a currency change never touches saved categories. Encrypted columns: `categories`, `currency`, `insights_layout`, `custom_charts`.

All encrypted columns are stored as `text`; the encryption layer handles serialization. Full schema with RLS policies in [`db/schema.sql`](./db/schema.sql).

**Upgrading an existing deployment:** re-run `db/schema.sql` in the Supabase SQL Editor — it's idempotent (`create table if not exists` / `add column if not exists`), so it's safe to paste the whole file again even though most of it already exists. Until you do, the app keeps working exactly as before; categories/currency/Insights layout/custom charts just stay local to whichever device made the change instead of syncing.

---

## Deployment

The app is a static SPA that works on any static host.

**Vercel** — connect your GitHub repo, add environment variables, deploy. Free tier covers personal use.

**Netlify / Cloudflare Pages** — same workflow.

Environment variables to set on your hosting platform:

| Variable                 | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                              |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key                          |
| `VITE_ENCRYPTION_SECRET` | Your encryption secret (same value as in `.env.local`) |

> The encryption secret must be **identical** across all environments that share the same Supabase database. Changing it makes all existing encrypted rows unreadable.

See [SETUP.md](./SETUP.md) for detailed deployment steps.

---

## Costs

Built to run on free tiers. Supabase's free plan includes:

- 500 MB database storage (~500,000+ transactions)
- 50,000 monthly active users
- 5 GB bandwidth/month

For personal use you'll never get close to any limit.

---

## Roadmap ideas

- [x] Installment plan tracking for credit card purchases
- [x] Investment portfolio tracking (stocks, funds, crypto, real estate, and Fixed Deposits with real payout math)
- [x] Custom, user-built charts on the Insights dashboard
- [x] Recurring payment reminders — available from the mobile/tablet Profile page; still not exposed in the desktop Account panel
- [ ] Recurring reminder editing (currently delete-and-recreate only)
- [ ] Savings goals with progress tracking
- [ ] Export to CSV / Excel
- [ ] Receipt photo attachments (Supabase Storage)
- [ ] Push notifications when a budget category exceeds its limit
- [ ] Shared household budgets (multi-user)
- [ ] Bank statement import
- [ ] Light theme toggle (currently dark only)
- [ ] i18n — UI translations

PRs welcome.

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-thing`)
3. Commit with clear messages
4. Push and open a Pull Request

For larger changes, open an issue first to discuss.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- [Supabase](https://supabase.com) for auth + Postgres with zero backend boilerplate
- [Lucide](https://lucide.dev) for the icon set
- [Vite](https://vitejs.dev) for the fast dev experience
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for Workbox PWA support

---

<p align="center">Built with care for anyone trying to make sense of their money.</p>

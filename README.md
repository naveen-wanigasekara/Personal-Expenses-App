# Personal Expenses Tracker

> A modern personal expense tracker for anyone, anywhere — record income, expenses, credit cards, and budgets with a beautiful dark UI and cloud sync.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ecf8e.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8.svg)

A mobile-first personal finance app that helps you record every transaction in and out, plan a monthly budget, track credit card debt without double-counting, and see exactly where your money goes — across devices, in real time. Install it to your phone's home screen like a native app.

---

## Features

### 💰 Track everything
- **Income** in 6 categories (Fixed, Passive, Bonus, Refunds, Emergency, Other)
- **Expenses** in 11 thoughtfully chosen categories that cover most households: Loan Repayment, House Rent, Utilities, Groceries, Healthcare, Transport & Vehicle, Shopping & Household, Entertainment & Dining, Insurance & Premiums, Savings & Investments, and Other
- **Credit cards** as full debt accounts with limits, balances, and utilization tracking

### 🎯 Plan with intent
- **Fixed plan** — set your default monthly income targets and expense budgets once, applied automatically every month
- **Per-month overrides** — adjust the plan for special months (bonuses, holidays) without touching your defaults
- **Per-category targets** for both income and expenses — not just an overall total
- See planned savings calculated live as you allocate

### 📊 Insights that matter
- **Plan vs. Actual** — track progress toward both income targets and spending limits at a glance
- **Where it went** — every budgeted category shown with remaining balance, even ones you haven't touched
- **Where it came from** — income breakdown by source with target tracking
- **Cashflow chart** — 6-month history with budget overlay lines
- **Credit health** — total debt, available credit, and utilization warnings (>70% warn, >90% danger)

### 💳 Honest credit card tracking
Three transaction types specifically for cards, designed to avoid double-counting:
- **Card Purchase** — adds to card balance + counts as an expense in its category
- **Card Payment** — reduces card balance, *not* a new expense (the spending was already recorded)
- **Card Interest & Fees** — adds to balance + counts as a real cost

### 📱 Installable anywhere
- Full Progressive Web App (PWA) support — install directly from your browser to any phone's home screen
- Works on iOS, Android, Windows, macOS, and Linux
- Offline-capable with smart caching of fonts, assets, and recent data
- No app store required, no platform fees, one codebase

### 🔐 Built for real use
- Email + password authentication via Supabase
- Row-Level Security ensures each user only sees their own data
- Cloud sync across phone, tablet, and desktop
- Optimistic UI — changes appear instantly, then save in the background
- Automatic re-sync when connectivity returns

---

## Currency & localization

Currently ships with **LKR (Sri Lankan Rupees)** as the default currency, using Sri Lankan number formatting (`1,50,000.00`). The currency symbol and locale are centralized as constants in `App.jsx` — changing them to USD, EUR, INR, or any other currency is a two-line edit:

```javascript
const CURRENCY = "$";               // was "Rs."
// ...
new Intl.NumberFormat("en-US", ...) // was "en-LK"
```

Proper multi-currency and locale settings from inside the app are on the roadmap.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (email + password) |
| PWA | vite-plugin-pwa (Workbox) |
| Icons | Lucide React |
| Typography | PT Serif + Source Sans 3 + JetBrains Mono |
| Styling | Vanilla CSS with CSS variables |

No framework lock-in, no UI library bloat — about 3,000 lines of clean React in a single component file.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/personal-expenses-tracker.git
cd personal-expenses-tracker
npm install

# 2. Set up Supabase (see SETUP.md for detailed steps)
#    - Create a free Supabase project
#    - Run schema.sql in the SQL Editor
#    - Copy your project URL and anon key

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and paste your Supabase credentials

# 4. Run locally
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and create your account.

**For full setup walkthrough including Supabase configuration and deployment**, see **[SETUP.md](./SETUP.md)**.

---

## Installing as a PWA

Once deployed, users can install the app directly to their device:

- **Android (Chrome/Edge)**: Tap the menu → "Install app" or "Add to Home screen"
- **iOS (Safari)**: Tap the Share button → "Add to Home Screen"
- **Desktop (Chrome/Edge)**: Click the install icon in the address bar

The app will run in standalone mode (no browser chrome), work offline, and launch instantly — indistinguishable from a native app.

---

## Screenshots

> Add screenshots of the Ledger, Insights, Cards, and Budget tabs here once deployed.

---

## Project structure

```
personal-expenses-tracker/
├── App.jsx              Main React component (all UI + logic)
├── supabase.js          Supabase client + data API helpers
├── usePWA.js            PWA install/update hook
├── main.jsx             React entry point
├── index.html           HTML shell with PWA meta tags
├── vite.config.js       Vite + PWA plugin config
├── schema.sql           Database tables + Row-Level Security policies
├── package.json         Dependencies
├── public/              Icons, favicon, screenshots
│   ├── favicon.svg
│   ├── favicon.ico
│   └── icons/           PWA icons (192, 512, maskable, apple-touch)
├── .env.example         Environment template
├── SETUP.md             Step-by-step setup & deployment guide
└── README.md            You are here
```

---

## Database schema

Three tables, all secured with Row-Level Security so users can only access their own rows:

- **`transactions`** — income, expenses, card purchases, payments, and interest
- **`cards`** — credit card accounts with limits and opening balances
- **`budgets`** — monthly plans (key = `'fixed'` for default, or `'2026-04'` for overrides)

Full schema with RLS policies in [`schema.sql`](./schema.sql).

---

## Deployment

The app is a static SPA that works on any host. Recommended:

- **Vercel** — connect your GitHub repo, add environment variables, deploy. Free tier covers personal use.
- **Netlify** — same workflow as Vercel.
- **Cloudflare Pages** — also great, also free.

Just remember to add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your hosting dashboard.

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

---

## Costs

Built to run on free tiers. With Supabase's free plan you get:

- 500 MB database storage (enough for ~500,000 transactions)
- 50,000 monthly active users
- 5 GB bandwidth/month
- Unlimited API requests

For personal use, you'll never hit any of these limits.

---

## Roadmap ideas

These aren't built yet, but the architecture supports them easily:

- [ ] In-app currency picker & locale settings (multi-currency support)
- [ ] Recurring transactions (auto-create rent, salary, etc.)
- [ ] Savings goals with progress tracking
- [ ] Export to CSV / Excel
- [ ] Receipt photo attachments (Supabase Storage)
- [ ] Push notifications when budget exceeds threshold
- [ ] Shared family/household budgets (multi-user)
- [ ] Bank statement import
- [ ] Dark / Light theme toggle (currently dark only)
- [ ] i18n — UI translations for multiple languages

PRs welcome.

---

## Contributing

This started as a personal project but I'm happy to accept contributions. If you find a bug or want to add a feature:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-thing`)
3. Commit your changes with clear messages
4. Push to your branch and open a Pull Request

For larger changes, please open an issue first to discuss.

---

## License

MIT — see [LICENSE](./LICENSE) for details. Use it, modify it, deploy your own version, build a business on top of it. Just don't blame me if your budget tells you uncomfortable truths.

---

## Acknowledgments

- [Supabase](https://supabase.com) for making backend setup actually pleasant
- [Lucide](https://lucide.dev) for the beautiful icon set
- [Vite](https://vitejs.dev) for the lightning-fast dev experience
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for seamless PWA support

---

<p align="center">
  Built with care for anyone trying to make sense of their money.
</p>
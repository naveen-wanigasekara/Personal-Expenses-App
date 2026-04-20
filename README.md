# Ledger

> A modern personal expense tracker built for Sri Lanka — track income, expenses, credit cards, and budgets with a beautiful dark UI and cloud sync.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ecf8e.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)

Ledger is a mobile-first personal finance app that helps you record every rupee in and out, plan a monthly budget, track credit card debt without double-counting, and see exactly where your money goes — across devices, in real time.

---

## Features

### 💰 Track everything
- **Income** in 6 categories (Fixed, Passive, Bonus, Refunds, Emergency, Other)
- **Expenses** in 11 categories optimized for Sri Lankan households (Loan Repayment, House Rent, Utilities, Groceries, Healthcare, Transport, Shopping, Entertainment, Insurance, Savings & Investments, Other)
- **Credit cards** as full debt accounts with limits, balances, and utilization tracking
- All amounts in LKR with proper Sri Lankan number formatting

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

### 🔐 Built for real use
- Email + password authentication via Supabase
- Row-Level Security ensures each user only sees their own data
- Cloud sync across phone, tablet, and desktop
- Optimistic UI — changes appear instantly, then save in the background
- Works offline-first thanks to React state + automatic re-sync

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (email + password) |
| Icons | Lucide React |
| Typography | PT Serif (Cambria-style) + Source Sans 3 + JetBrains Mono |
| Styling | Vanilla CSS with CSS variables |

No framework lock-in, no UI library bloat — about 3,000 lines of clean React in a single component file.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/ledger.git
cd ledger
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

## Screenshots

> Add screenshots of the Ledger, Insights, Cards, and Budget tabs here once deployed.

---

## Project structure

```
ledger/
├── App.jsx           Main React component (all UI + logic)
├── supabase.js       Supabase client + data API helpers
├── main.jsx          React entry point
├── index.html        HTML shell
├── schema.sql        Database tables + Row-Level Security policies
├── package.json      Dependencies
├── vite.config.js    Vite build config
├── .env.example      Environment template
├── SETUP.md          Step-by-step setup & deployment guide
└── README.md         You are here
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

- [ ] Recurring transactions (auto-create rent, salary, etc.)
- [ ] Savings goals with progress tracking
- [ ] Export to CSV / Excel
- [ ] Receipt photo attachments (Supabase Storage)
- [ ] Multi-currency support
- [ ] Push notifications when budget exceeds threshold
- [ ] Shared family budgets (multi-user)
- [ ] Bank statement import
- [ ] Dark / Light theme toggle (currently dark only)

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
- The Sri Lankan personal finance community whose category lists informed the defaults

---

<p align="center">
  Built with care for anyone trying to make sense of their money.
</p>

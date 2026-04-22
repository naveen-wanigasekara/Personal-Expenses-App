# Ledger — Setup Guide

Step-by-step instructions to get the app running locally and deployed to production.

## What you'll need

- Node.js 18+ ([download](https://nodejs.org))
- A free Supabase account ([signup](https://supabase.com))
- A text editor (VS Code recommended)

---

## Step 1 — Create your Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name**: Ledger (or whatever you like)
   - **Database Password**: choose a strong one and save it
   - **Region**: pick the closest to your users — **Singapore** is best for South/Southeast Asia
   - **Plan**: Free
4. Click **Create new project** and wait ~2 minutes while it provisions

---

## Step 2 — Set up the database schema

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open [`db/schema.sql`](./db/schema.sql) from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (or Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned."

This creates three tables (`transactions`, `cards`, `budgets`) with Row-Level Security so every user can only access their own rows.

> **Existing deployment?** If you have an earlier version of this app already running with data in your database, run [`db/schema_migration.sql`](./db/schema_migration.sql) instead to migrate the column types to `text` for encrypted storage. Read the comments in that file before running it.

---

## Step 3 — Configure email authentication

1. In the Supabase dashboard, go to **Authentication → Providers**
2. Make sure **Email** is enabled (it is by default)
3. **For local development:** Go to **Authentication → Settings** and under "Email Auth", you can turn off **"Confirm email"** so you don't have to verify every test account
4. Turn email confirmation back **ON** before deploying publicly

---

## Step 4 — Get your API credentials

1. In the Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key (the long JWT string under "Project API keys")

---

## Step 5 — Generate an encryption secret

All financial data is encrypted in the browser with AES-GCM-256 before it is stored. The encryption key is derived from your user ID combined with this secret.

Generate a strong random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copy the output — you'll need it in the next step and again when you deploy.

> **Important:** this secret must stay the same for the lifetime of the database. If you change it, all existing encrypted rows become unreadable. Never commit it to source control.

---

## Step 6 — Configure the environment

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/YOUR_USERNAME/personal-expenses-tracker.git
   cd personal-expenses-tracker
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` and fill in the three values:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   VITE_ENCRYPTION_SECRET=your-generated-secret-here
   ```

---

## Step 7 — Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You should see the sign-in screen.

---

## Step 8 — Create your first account

1. Click **Sign up**
2. Enter an email and password (minimum 6 characters)
3. If email confirmation is off, you're logged in immediately
4. If email confirmation is on, check your inbox and click the confirmation link

---

## Step 9 — Deploy

### Option A: Vercel (recommended, free)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New → Project** and import your repo
4. In **Environment Variables**, add all three:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ENCRYPTION_SECRET` ← use the same value as in your `.env.local`
5. Click **Deploy** — you'll get a URL like `your-app.vercel.app`

### Option B: Netlify

Same workflow — connect GitHub, add the three env variables under **Site settings → Environment variables**, deploy.

### Option C: Build and host anywhere

```bash
npm run build
```

The `dist/` folder is a self-contained static site. Upload it to any web host (Cloudflare Pages, S3 + CloudFront, GitHub Pages with a custom domain, etc.).

---

## Security notes

| Topic | Detail |
|---|---|
| Anon key | Safe to expose in the frontend — that's what it's designed for. It only grants access to rows RLS permits. |
| Service role key | **Never** put this in frontend code. It bypasses RLS. |
| Encryption secret | Must be kept secret and never committed. Rotate only if you are prepared to re-encrypt all existing data. |
| RLS | Row-Level Security in `db/schema.sql` ensures users can never access each other's rows, even if someone probes the API directly. |
| Email confirmation | Turn it on in Supabase before going public to prevent abuse. |

---

## Project structure

```
personal-expenses-tracker/
├── src/
│   ├── main.jsx                  Entry point
│   ├── App.jsx                   Root auth gate
│   ├── context.js                Currency context
│   ├── styles/app.css            All styles
│   ├── lib/
│   │   ├── supabase.js           Supabase client + encrypted data API
│   │   └── crypto.js             AES-GCM-256 encryption helpers
│   ├── hooks/usePWA.js           PWA install/update hook
│   ├── constants/                Categories, currencies, help content
│   ├── utils/                    Formatting + localStorage helpers
│   └── components/               All UI components (19 files)
├── db/
│   ├── schema.sql                Run this in Supabase SQL Editor
│   └── schema_migration.sql     Run this only when upgrading an existing deployment
├── public/                       PWA icons, favicon, screenshots
├── index.html
├── vite.config.js
├── package.json
├── .env.example                  ← copy to .env.local
├── SETUP.md                      This file
└── README.md
```

---

## Troubleshooting

**"Couldn't load your data. Please refresh."**
- Check `.env.local` has the correct Supabase URL and anon key
- Confirm `db/schema.sql` ran successfully in the SQL Editor (look for the three tables in the Table Editor)
- Open the browser console (F12 → Console) for specific error messages

**Sign in succeeds but data looks wrong / garbled**
- The `VITE_ENCRYPTION_SECRET` in your environment does not match the one used when the data was originally written
- Make sure it's exactly the same string as when you first set up the database

**Can't sign up**
- Minimum password length is 6 characters
- Check that signups aren't disabled in Supabase → Authentication → Settings

**Data not syncing across devices**
- Confirm you're signed in with the same email on both devices
- Check the browser console for network errors

**PWA install prompt not appearing**
- The app must be served over HTTPS for PWA install to work — `localhost` is an exception for development
- Some browsers require the page to have been visited at least twice before showing the prompt

---

## Supabase free tier limits

| Resource | Free allowance |
|---|---|
| Database storage | 500 MB |
| Monthly active users | 50,000 |
| Bandwidth | 5 GB/month |
| File storage | 1 GB |

For a personal expense tracker used by one or a few people, none of these limits will ever be reached.

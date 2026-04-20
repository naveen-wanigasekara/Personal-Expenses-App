# Ledger — Expense Tracker Setup Guide

A personal expense tracker with Supabase authentication and cloud sync.

## What you'll need

1. Node.js 18+ installed on your machine ([download](https://nodejs.org))
2. A free Supabase account ([signup](https://supabase.com))
3. A text editor (VS Code recommended)

---

## Step 1 — Create your Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign up / log in
2. Click **New project**
3. Fill in:
   - **Name**: Ledger (or whatever you want)
   - **Database Password**: choose a strong one, save it somewhere safe
   - **Region**: pick the one closest to Sri Lanka — **Singapore (Southeast Asia)** is the best choice
   - **Plan**: Free
4. Click **Create new project** and wait ~2 minutes while it provisions

---

## Step 2 — Set up the database schema

1. In your Supabase dashboard, click the **SQL Editor** icon in the left sidebar
2. Click **New query**
3. Open the file `schema.sql` from this project folder
4. Copy its entire contents and paste into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned."

This creates three tables (`transactions`, `cards`, `budgets`) with Row-Level Security so users can only see their own data.

---

## Step 3 — Configure authentication

1. In Supabase dashboard, go to **Authentication → Providers**
2. Make sure **Email** is enabled (it is by default)
3. **Important for testing:** Go to **Authentication → Settings** and under "Email Auth":
   - You can turn OFF **"Confirm email"** while testing so you don't have to verify each time
   - Turn it back ON before you deploy publicly

---

## Step 4 — Get your API credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like `https://abcdef.supabase.co`)
   - **anon public** key (a long JWT string under "Project API keys")

---

## Step 5 — Set up the app locally

1. Open a terminal, navigate to this folder:
   ```bash
   cd expense-tracker-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Open `.env.local` in your editor and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://abcdef.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) — you should see the sign-in screen.

---

## Step 6 — Create your first account

1. On the sign-in screen, click **Sign up**
2. Enter an email and password (min 6 characters)
3. If email confirmation is OFF, you're logged in immediately
4. If email confirmation is ON, check your inbox and click the confirmation link

---

## Step 7 — Deploy (when ready)

### Option A: Vercel (easiest, free)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New → Project** and import your repo
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy** — you'll get a URL like `your-app.vercel.app`

### Option B: Netlify

Same idea — connect GitHub, add the same two env variables, deploy.

### Option C: Build and host anywhere

```bash
npm run build
```

The `dist/` folder contains static files you can upload to any web host.

---

## Important security notes

- The **anon key** is safe to expose in the frontend — that's what it's designed for
- Row-Level Security (set up in `schema.sql`) ensures each user can only see their own data at the database level
- The **service role key** (different from anon) must **NEVER** be in your frontend code
- If you deploy publicly, turn email confirmation back ON in Supabase

---

## What's in this project

```
expense-tracker-app/
├── App.jsx              # Main React component (all UI)
├── supabase.js          # Supabase client + data API
├── main.jsx             # React entry point
├── index.html           # HTML shell
├── package.json         # Dependencies
├── vite.config.js       # Vite build config
├── schema.sql           # Database schema to paste into Supabase
├── .env.example         # Template for your credentials
└── SETUP.md             # This file
```

---

## Free tier limits (more than enough for personal use)

- **500 MB** database storage
- **50,000** monthly active users
- **5 GB** bandwidth per month
- **2 GB** file storage

For a personal expense tracker, you'll use maybe 0.1% of any of these limits.

---

## Troubleshooting

**"Couldn't load your data. Please refresh."**
- Check your `.env.local` has the correct URL and key
- Check the schema was applied successfully in Supabase SQL Editor
- Open the browser console (F12) for detailed errors

**Can't sign up**
- Minimum password length is 6 characters
- Check Supabase's auth settings haven't disabled signups

**Data not syncing across devices**
- Make sure you're signed in with the same email on both
- Check that Row-Level Security is enabled (it's in `schema.sql`)

---

## Adding more features later

The database is set up so you can extend easily. Ideas:
- Add a `recurring_transactions` table for auto-repeating items
- Add a `savings_goals` table for tracking target amounts
- Hook up push notifications via Supabase Realtime for budget warnings
- Add export to CSV/Excel

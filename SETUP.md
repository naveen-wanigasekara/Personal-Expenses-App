# Ledger — Setup Guide

Step-by-step instructions to get the app running locally and deployed to production.

## What you'll need

- Node.js 24.15+ ([download](https://nodejs.org))
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

## Step 5 — Secure backend and server setup

Follow [the security rollout checklist](docs/SECURITY_HARDENING.md) before running
this branch. It requires an isolated Supabase project, the transactional database
security script, server-only encryption keys, Auth settings and a Node endpoint.
Do not connect previews to the production database.

Copy `.env.example` to `.env.local` and supply the isolated project's values.
Use a Vercel development environment to run both Vite and `/api/crypto-key`;
`npm run dev` alone serves the frontend and cannot unlock financial data.

Run `npm ci --ignore-scripts` and `npm test` to build and run local tests.

---

## Step 8 — Create your first account

1. Click **Sign up**
2. Enter an email and password (minimum 12 characters)
3. If email confirmation is off, you're logged in immediately
4. If email confirmation is on, check your inbox and click the confirmation link

---

## Step 9 — Deploy

Use Vercel with its Node function support. Configure every value from
`.env.example` for the isolated QA project, apply the SQL and Auth configuration,
and follow [the rollout checklist](docs/SECURITY_HARDENING.md). A static-only
upload of `dist/` cannot serve the authenticated key endpoint.

Production release and database migration need separate approval after hosted QA.

---

## Security notes

| Topic              | Detail                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Anon key           | Safe to expose in the frontend — that's what it's designed for. It only grants access to rows RLS permits.                       |
| Service role key   | **Never** put this in frontend code. It bypasses RLS.                                                                            |
| Encryption secret  | Must be kept secret and never committed. Rotate only if you are prepared to re-encrypt all existing data.                        |
| RLS                | Row-Level Security in `db/schema.sql` restricts ordinary API access to the owner; privileged administrators and service-role credentials bypass RLS. |
| Email confirmation | Turn it on in Supabase before going public to prevent abuse.                                                                     |

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

- The `LEGACY_ENCRYPTION_SECRET` in your environment does not match the one used when the data was originally written
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

| Resource             | Free allowance |
| -------------------- | -------------- |
| Database storage     | 500 MB         |
| Monthly active users | 50,000         |
| Bandwidth            | 5 GB/month     |
| File storage         | 1 GB           |

For a personal expense tracker used by one or a few people, none of these limits will ever be reached.

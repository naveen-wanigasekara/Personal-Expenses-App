-- ============================================================
-- EXPENSE TRACKER - SUPABASE SCHEMA
-- Paste this into: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── TRANSACTIONS TABLE ─────────────────────────────────────
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'card-purchase', 'card-payment', 'card-interest')),
  amount text not null,            -- encrypted
  category text,                   -- encrypted
  card_id text,
  note text default '',            -- encrypted
  date text not null,              -- encrypted
  created_at timestamptz default now()
);

-- Links an installment-plan-generated purchase back to its plan — was
-- missing from this file even though the app has depended on it since the
-- installment plans feature shipped; add-column-if-not-exists so re-running
-- this file is still safe against the live table that already has it.
alter table public.transactions add column if not exists installment_id text;

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

create index if not exists transactions_user_card_idx
  on public.transactions (user_id, card_id);

-- ─── CARDS TABLE ────────────────────────────────────────────
create table if not exists public.cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,              -- encrypted
  credit_limit text not null,      -- encrypted
  opening_balance text not null,   -- encrypted
  colors text,                     -- encrypted
  created_at timestamptz default now()
);

create index if not exists cards_user_idx on public.cards (user_id);

-- ─── BUDGETS TABLE ──────────────────────────────────────────
-- One row per (user, month_key). month_key is 'fixed' for the default plan,
-- or '2026-04' for a specific month override.
create table if not exists public.budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,         -- 'fixed' or 'YYYY-MM'
  income_total text,               -- encrypted
  income_categories text,          -- encrypted
  expense_total text,              -- encrypted
  expense_categories text,         -- encrypted
  updated_at timestamptz default now(),
  primary key (user_id, month_key)
);

-- ─── INSTALLMENT PLANS TABLE ────────────────────────────────
create table if not exists public.installment_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text,
  label text,                      -- encrypted
  total_amount text,               -- encrypted
  monthly_amount text,             -- encrypted
  total_months text,               -- encrypted
  start_month text,                -- encrypted
  category text,                   -- encrypted
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists installment_plans_user_idx
  on public.installment_plans (user_id);

-- ─── RECURRING REMINDERS TABLE ──────────────────────────────
create table if not exists public.recurring_reminders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,                      -- encrypted
  amount text,                     -- encrypted
  day_of_month text,               -- encrypted
  category text,                   -- encrypted
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists recurring_reminders_user_idx
  on public.recurring_reminders (user_id);

-- ─── INVESTMENTS TABLE ──────────────────────────────────────
create table if not exists public.investments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,              -- encrypted
  type text,                       -- encrypted
  initial_amount text not null,    -- encrypted
  current_value text not null,     -- encrypted
  start_date text,                 -- encrypted
  notes text,                      -- encrypted
  created_at timestamptz default now()
);

-- Fixed Deposit-specific fields — null for every other investment type.
-- alter/add-column-if-not-exists so this applies safely to the live table
-- created by the block above in an earlier deploy.
alter table public.investments add column if not exists interest_rate text;     -- encrypted
alter table public.investments add column if not exists payout_frequency text; -- encrypted
alter table public.investments add column if not exists tenure_months text;    -- encrypted

create index if not exists investments_user_idx on public.investments (user_id);

-- ─── INVESTMENT VALUATIONS TABLE ────────────────────────────
-- investment_id is a plaintext join key (like card_id on transactions) — no
-- FK/cascade; the app is responsible for cleanup when an investment is deleted.
create table if not exists public.investment_valuations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id text not null,
  value text not null,             -- encrypted
  recorded_date text not null,     -- encrypted
  created_at timestamptz default now()
);

create index if not exists investment_valuations_investment_idx
  on public.investment_valuations (investment_id);

create index if not exists investment_valuations_user_idx
  on public.investment_valuations (user_id);

-- ─── USER SETTINGS TABLE ────────────────────────────────────
-- One row per user. Each column is an independently-updatable JSON blob —
-- categories, currency, insights layout, and custom charts were previously
-- localStorage-only (never synced across devices); this is what makes them
-- follow the user like every other table does. Columns are updated via
-- partial upsert (only the changed column is sent), so a currency change
-- never touches categories and vice versa.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  categories text,          -- encrypted: { income: [...], expense: [...] }
  currency text,            -- encrypted: currency symbol string
  insights_layout text,     -- encrypted: [{ id, visible }, ...]
  custom_charts text,       -- encrypted: [chart config, ...]
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW-LEVEL SECURITY: users can only see/modify their own data
-- ============================================================
alter table public.transactions enable row level security;
alter table public.cards enable row level security;
alter table public.budgets enable row level security;
alter table public.installment_plans enable row level security;
alter table public.recurring_reminders enable row level security;
alter table public.investments enable row level security;
alter table public.investment_valuations enable row level security;
alter table public.user_settings enable row level security;

-- Transactions policies
drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "tx_insert_own" on public.transactions;
create policy "tx_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "tx_delete_own" on public.transactions;
create policy "tx_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

drop policy if exists "tx_update_own" on public.transactions;
create policy "tx_update_own" on public.transactions
  for update using (auth.uid() = user_id);

-- Cards policies
drop policy if exists "cards_select_own" on public.cards;
create policy "cards_select_own" on public.cards
  for select using (auth.uid() = user_id);

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own" on public.cards
  for insert with check (auth.uid() = user_id);

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own" on public.cards
  for update using (auth.uid() = user_id);

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own" on public.cards
  for delete using (auth.uid() = user_id);

-- Budgets policies
drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- Installment plans policies
drop policy if exists "installment_plans_select_own" on public.installment_plans;
create policy "installment_plans_select_own" on public.installment_plans
  for select using (auth.uid() = user_id);

drop policy if exists "installment_plans_insert_own" on public.installment_plans;
create policy "installment_plans_insert_own" on public.installment_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "installment_plans_update_own" on public.installment_plans;
create policy "installment_plans_update_own" on public.installment_plans
  for update using (auth.uid() = user_id);

drop policy if exists "installment_plans_delete_own" on public.installment_plans;
create policy "installment_plans_delete_own" on public.installment_plans
  for delete using (auth.uid() = user_id);

-- Recurring reminders policies
drop policy if exists "recurring_reminders_select_own" on public.recurring_reminders;
create policy "recurring_reminders_select_own" on public.recurring_reminders
  for select using (auth.uid() = user_id);

drop policy if exists "recurring_reminders_insert_own" on public.recurring_reminders;
create policy "recurring_reminders_insert_own" on public.recurring_reminders
  for insert with check (auth.uid() = user_id);

drop policy if exists "recurring_reminders_update_own" on public.recurring_reminders;
create policy "recurring_reminders_update_own" on public.recurring_reminders
  for update using (auth.uid() = user_id);

drop policy if exists "recurring_reminders_delete_own" on public.recurring_reminders;
create policy "recurring_reminders_delete_own" on public.recurring_reminders
  for delete using (auth.uid() = user_id);

-- Investments policies
drop policy if exists "investments_select_own" on public.investments;
create policy "investments_select_own" on public.investments
  for select using (auth.uid() = user_id);

drop policy if exists "investments_insert_own" on public.investments;
create policy "investments_insert_own" on public.investments
  for insert with check (auth.uid() = user_id);

drop policy if exists "investments_update_own" on public.investments;
create policy "investments_update_own" on public.investments
  for update using (auth.uid() = user_id);

drop policy if exists "investments_delete_own" on public.investments;
create policy "investments_delete_own" on public.investments
  for delete using (auth.uid() = user_id);

-- Investment valuations policies
drop policy if exists "investment_valuations_select_own" on public.investment_valuations;
create policy "investment_valuations_select_own" on public.investment_valuations
  for select using (auth.uid() = user_id);

drop policy if exists "investment_valuations_insert_own" on public.investment_valuations;
create policy "investment_valuations_insert_own" on public.investment_valuations
  for insert with check (auth.uid() = user_id);

drop policy if exists "investment_valuations_update_own" on public.investment_valuations;
create policy "investment_valuations_update_own" on public.investment_valuations
  for update using (auth.uid() = user_id);

drop policy if exists "investment_valuations_delete_own" on public.investment_valuations;
create policy "investment_valuations_delete_own" on public.investment_valuations
  for delete using (auth.uid() = user_id);

-- User settings policies
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own" on public.user_settings
  for delete using (auth.uid() = user_id);

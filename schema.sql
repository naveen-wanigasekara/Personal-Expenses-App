-- ============================================================
-- EXPENSE TRACKER - SUPABASE SCHEMA
-- Paste this into: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── TRANSACTIONS TABLE ─────────────────────────────────────
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'card-purchase', 'card-payment', 'card-interest')),
  amount numeric not null check (amount > 0),
  category text,
  card_id text,
  note text default '',
  date date not null,
  created_at timestamptz default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

create index if not exists transactions_user_card_idx
  on public.transactions (user_id, card_id);

-- ─── CARDS TABLE ────────────────────────────────────────────
create table if not exists public.cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  credit_limit numeric not null default 0,
  opening_balance numeric not null default 0,
  colors jsonb,                     -- ['#5b21b6', '#7c3aed']
  created_at timestamptz default now()
);

create index if not exists cards_user_idx on public.cards (user_id);

-- ─── BUDGETS TABLE ──────────────────────────────────────────
-- One row per (user, month_key). month_key is 'fixed' for the default plan,
-- or '2026-04' for a specific month override.
create table if not exists public.budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,         -- 'fixed' or 'YYYY-MM'
  income_total numeric default 0,
  income_categories jsonb default '{}'::jsonb,
  expense_total numeric default 0,
  expense_categories jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, month_key)
);

-- ============================================================
-- ROW-LEVEL SECURITY: users can only see/modify their own data
-- ============================================================
alter table public.transactions enable row level security;
alter table public.cards enable row level security;
alter table public.budgets enable row level security;

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

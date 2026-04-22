-- ============================================================
-- ENCRYPTION MIGRATION
-- Run this once in: Supabase Dashboard → SQL Editor → New query
--
-- Changes the encrypted columns from their original numeric/date/jsonb
-- types to text so that AES-GCM ciphertext can be stored.
-- Existing row values are cast to text and will be read transparently
-- by the app's backwards-compatible decryptValue() helper until they
-- are overwritten with encrypted values on next save.
-- ============================================================

-- ─── TRANSACTIONS ────────────────────────────────────────────
-- Drop the amount > 0 check constraint (can't apply to ciphertext)
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_amount_check;

-- Change amount (numeric → text) and date (date → text)
ALTER TABLE public.transactions
  ALTER COLUMN amount TYPE text USING amount::text,
  ALTER COLUMN date   TYPE text USING date::text;

-- ─── CARDS ───────────────────────────────────────────────────
-- Drop numeric defaults (meaningless for encrypted text)
ALTER TABLE public.cards
  ALTER COLUMN credit_limit    DROP DEFAULT,
  ALTER COLUMN opening_balance DROP DEFAULT;

-- Change numeric and jsonb columns to text
ALTER TABLE public.cards
  ALTER COLUMN credit_limit    TYPE text USING credit_limit::text,
  ALTER COLUMN opening_balance TYPE text USING opening_balance::text,
  ALTER COLUMN colors          TYPE text USING colors::text;

-- ─── BUDGETS ─────────────────────────────────────────────────
-- Drop numeric/jsonb defaults
ALTER TABLE public.budgets
  ALTER COLUMN income_total       DROP DEFAULT,
  ALTER COLUMN income_categories  DROP DEFAULT,
  ALTER COLUMN expense_total      DROP DEFAULT,
  ALTER COLUMN expense_categories DROP DEFAULT;

-- Change numeric and jsonb columns to text
ALTER TABLE public.budgets
  ALTER COLUMN income_total       TYPE text USING income_total::text,
  ALTER COLUMN income_categories  TYPE text USING income_categories::text,
  ALTER COLUMN expense_total      TYPE text USING expense_total::text,
  ALTER COLUMN expense_categories TYPE text USING expense_categories::text;

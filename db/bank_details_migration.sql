-- Additive migration for Bank Details. Apply to the intended database before
-- using the feature. Existing user_settings RLS policies remain unchanged:
-- every read/write is limited to auth.uid() = user_id.
-- The app stores the account list as encrypted text, not plaintext JSON.
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS bank_details text;

import { createClient } from "@supabase/supabase-js";
import {
  initCrypto, clearCrypto,
  encryptFields, decryptFields,
} from "./crypto.js";

export { initCrypto, clearCrypto };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY_HERE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const TX_ENC     = ["amount", "category", "note", "date"];
const CARD_ENC   = ["name", "credit_limit", "opening_balance", "colors"];
const BUDGET_ENC = ["income_total", "income_categories", "expense_total", "expense_categories"];

/* ─── AUTH HELPERS ────────────────────────────────────────── */
export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password });
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function resetPassword(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
}

/* ─── DATA API ────────────────────────────────────────────── */
/* Transactions */
export async function fetchTransactions(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = await Promise.all((data || []).map((r) => decryptFields(r, TX_ENC)));
  // Sort client-side because the date column is stored encrypted
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  return rows;
}

export async function insertTransaction(tx) {
  const enc = await encryptFields(tx, TX_ENC);
  const { data, error } = await supabase
    .from("transactions")
    .insert([enc])
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, TX_ENC);
}

export async function updateTransaction(id, updates) {
  const enc = await encryptFields(updates, TX_ENC);
  const { data, error } = await supabase
    .from("transactions")
    .update(enc)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, TX_ENC);
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

/* Cards */
export async function fetchCards(userId) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return Promise.all((data || []).map((r) => decryptFields(r, CARD_ENC)));
}

export async function upsertCard(card) {
  const enc = await encryptFields(card, CARD_ENC);
  const { data, error } = await supabase
    .from("cards")
    .upsert(enc)
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, CARD_ENC);
}

export async function deleteCard(id) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

/* Budgets — fixed plan + monthly overrides stored in one table */
export async function fetchBudgets(userId) {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return Promise.all((data || []).map((r) => decryptFields(r, BUDGET_ENC)));
}

export async function upsertBudget(budget) {
  const enc = await encryptFields(budget, BUDGET_ENC);
  const { data, error } = await supabase
    .from("budgets")
    .upsert(enc, { onConflict: "user_id,month_key" })
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, BUDGET_ENC);
}

const INSTALLMENT_ENC = ["label", "total_amount", "monthly_amount", "total_months", "start_month", "category"];
const REMINDER_ENC = ["label", "amount", "day_of_month", "category"];

/* Installment Plans */
export async function fetchInstallmentPlans(userId) {
  const { data, error } = await supabase
    .from("installment_plans")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return Promise.all((data || []).map((r) => decryptFields(r, INSTALLMENT_ENC)));
}

export async function insertInstallmentPlan(plan) {
  const enc = await encryptFields(plan, INSTALLMENT_ENC);
  const { data, error } = await supabase
    .from("installment_plans")
    .insert([enc])
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, INSTALLMENT_ENC);
}

export async function updateInstallmentPlan(id, updates) {
  const enc = await encryptFields(updates, INSTALLMENT_ENC);
  const { data, error } = await supabase
    .from("installment_plans")
    .update(enc)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, INSTALLMENT_ENC);
}

/* Recurring Reminders */
export async function fetchRecurringReminders(userId) {
  const { data, error } = await supabase
    .from("recurring_reminders")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return Promise.all((data || []).map((r) => decryptFields(r, REMINDER_ENC)));
}

export async function insertRecurringReminder(reminder) {
  const enc = await encryptFields(reminder, REMINDER_ENC);
  const { data, error } = await supabase
    .from("recurring_reminders")
    .insert([enc])
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, REMINDER_ENC);
}

export async function updateRecurringReminder(id, updates) {
  const enc = await encryptFields(updates, REMINDER_ENC);
  const { data, error } = await supabase
    .from("recurring_reminders")
    .update(enc)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return decryptFields(data, REMINDER_ENC);
}

export async function deleteRecurringReminder(id) {
  const { error } = await supabase.from("recurring_reminders").delete().eq("id", id);
  if (error) throw error;
}

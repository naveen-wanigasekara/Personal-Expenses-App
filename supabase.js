import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com → your project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY_HERE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertTransaction(tx) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([tx])
    .select()
    .single();
  if (error) throw error;
  return data;
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
  return data || [];
}

export async function upsertCard(card) {
  const { data, error } = await supabase
    .from("cards")
    .upsert(card)
    .select()
    .single();
  if (error) throw error;
  return data;
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
  return data || [];
}

export async function upsertBudget(budget) {
  const { data, error } = await supabase
    .from("budgets")
    .upsert(budget, { onConflict: "user_id,month_key" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

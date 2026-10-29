const FIELDS = ["bank", "branch", "accountName", "accountNumber"];
const clean = (value) => typeof value === "string" ? value.trim().replace(/[\r\n\t]+/g, " ") : "";

export function normalizeBankDetails(details) {
  return Object.fromEntries(FIELDS.map((key) => [key, clean(details?.[key])]));
}

export function validBankDetails(details) {
  const normalized = normalizeBankDetails(details);
  return FIELDS.every((key) => normalized[key].length > 0 && normalized[key].length <= (key === "accountNumber" ? 80 : 120));
}

export function formatBankDetails(details) {
  const account = normalizeBankDetails(details);
  return `Bank: ${account.bank}\nBranch: ${account.branch}\nAccount Name: ${account.accountName}\nAccount Number: ${account.accountNumber}`;
}

export async function copyBankDetails(details, clipboard) {
  if (!validBankDetails(details)) throw new Error("Enter all bank details before copying.");
  if (!clipboard?.writeText) throw new Error("Clipboard unavailable");
  await clipboard.writeText(formatBankDetails(details));
}

function validateAccounts(accounts) {
  if (!Array.isArray(accounts) || accounts.some((account) => !account || typeof account.id !== "string" || !account.id || !validBankDetails(account)) || new Set(accounts.map((account) => account.id)).size !== accounts.length) {
    throw new Error("Saved bank details could not be read.");
  }
  return accounts.map((account) => ({ id: account.id, ...normalizeBankDetails(account) }));
}

// The account-owned settings row already has RLS. Only the bank_details
// column is updated, so other settings cannot be overwritten by this store.
export function createBankDetailsStore(client, { encryptValue, decryptValue }) {
  return {
    async load(userId) {
      if (!userId) throw new Error("Sign in to view bank details.");
      const { data, error } = await client.from("user_settings").select("bank_details").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      if (data?.bank_details == null) return [];
      return validateAccounts(await decryptValue(data.bank_details));
    },
    async save(userId, accounts) {
      if (!userId) throw new Error("Sign in to save bank details.");
      const normalized = validateAccounts(accounts);
      const bank_details = await encryptValue(normalized);
      const { error } = await client.from("user_settings").upsert({ user_id: userId, bank_details }, { onConflict: "user_id" });
      if (error) throw error;
      return normalized;
    },
  };
}

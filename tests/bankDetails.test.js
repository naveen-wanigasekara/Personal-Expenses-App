import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBankDetails, validBankDetails, formatBankDetails, copyBankDetails, createBankDetailsStore } from "../src/utils/bankDetails.js";

const account = { id: "test-account", bank: "Example Bank", branch: "Central", accountName: "Test User", accountNumber: "0012345678" };
function fixture() {
  const rows = new Map();
  const writes = [];
  let error = null;
  const client = { from(table) {
    assert.equal(table, "user_settings");
    return {
      select(column) {
        assert.equal(column, "bank_details");
        return { eq(field, userId) {
          assert.equal(field, "user_id");
          return { async maybeSingle() { return { data: rows.get(userId) ?? null, error }; } };
        } };
      },
      async upsert(row, options) {
        assert.deepEqual(Object.keys(row).sort(), ["bank_details", "user_id"]);
        assert.deepEqual(options, { onConflict: "user_id" });
        writes.push(row);
        if (!error) rows.set(row.user_id, { bank_details: row.bank_details });
        return { error };
      },
    };
  } };
  const store = createBankDetailsStore(client, {
    encryptValue: async (value) => `encrypted:${JSON.stringify(value)}`,
    decryptValue: async (value) => JSON.parse(value.slice("encrypted:".length)),
  });
  return { store, rows, writes, fail(value) { error = value; } };
}

test("copy text contains exactly the requested fields and preserves leading zeros", () => {
  assert.equal(formatBankDetails(account), "Bank: Example Bank\nBranch: Central\nAccount Name: Test User\nAccount Number: 0012345678");
  assert.equal(normalizeBankDetails({ ...account, accountNumber: "  0012345678  " }).accountNumber, "0012345678");
});
test("requires all four text fields and prevents embedded line breaks from adding copy labels", () => {
  assert.equal(validBankDetails(account), true);
  for (const key of ["bank", "branch", "accountName", "accountNumber"]) assert.equal(validBankDetails({ ...account, [key]: "  " }), false);
  assert.equal(validBankDetails({ ...account, accountNumber: 12345678 }), false);
  assert.equal(validBankDetails({ ...account, bank: "x".repeat(121) }), false);
  assert.equal(normalizeBankDetails({ ...account, branch: "Main\nBranch" }).branch, "Main Branch");
});
test("saves encrypted bank data separately for each user without touching other settings", async () => {
  const { store, writes } = fixture();
  assert.deepEqual(await store.load("user-a"), []);
  await store.save("user-a", [account]);
  assert.ok(writes[0].bank_details.startsWith("encrypted:"));
  assert.deepEqual(await store.load("user-a"), [account]);
  assert.deepEqual(await store.load("user-b"), []);
});
test("supports edits and removal without changing account number types", async () => {
  const { store } = fixture();
  const second = { ...account, id: "second", bank: "Second Bank", accountNumber: "00002" };
  await store.save("user-a", [account, second]);
  await store.save("user-a", [{ ...account, branch: "Updated" }, second]);
  assert.equal((await store.load("user-a"))[0].branch, "Updated");
  await store.save("user-a", [second]);
  assert.deepEqual(await store.load("user-a"), [second]);
});
test("surfaces database failures and unreadable saved data instead of clearing it", async () => {
  const { store, rows, fail } = fixture();
  const failure = new Error("Database unavailable");
  fail(failure);
  await assert.rejects(store.load("user-a"), failure);
  await assert.rejects(store.save("user-a", [account]), failure);
  fail(null);
  rows.set("user-a", { bank_details: "encrypted:null" });
  await assert.rejects(store.load("user-a"), /could not be read/);
  await assert.rejects(store.save("user-a", [account, account]), /could not be read/);
  await assert.rejects(store.save("", [account]), /Sign in/);
});

test("copies only the formatted bank details and reports clipboard failures", async () => {
  let copied = null;
  await copyBankDetails(account, { async writeText(value) { copied = value; } });
  assert.equal(copied, formatBankDetails(account));
  assert.ok(!copied.includes(account.id));
  await assert.rejects(copyBankDetails(account, undefined), /Clipboard unavailable/);
  await assert.rejects(copyBankDetails(account, { async writeText() { throw new Error("Denied"); } }), /Denied/);
});

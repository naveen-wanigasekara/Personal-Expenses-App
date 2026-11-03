let keys = null;
let epoch = 0;

export function clearCrypto() { epoch++; keys = null; }

export async function initCrypto(userId, { accessToken, fetcher = fetch } = {}) {
  const generation = ++epoch;
  keys = null;
  if (!userId || !accessToken) throw new Error("Sign in to unlock your financial data.");
  const response = await fetcher("/api/crypto-key", {
    method: "POST", cache: "no-store", credentials: "same-origin",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Secure data access is unavailable. Please try again.");
  const result = await response.json();
  if (result.userId !== userId || result.version !== 2) throw new Error("Invalid encryption configuration.");
  const current = await importKey(result.key);
  const legacy = result.legacyKey ? await importKey(result.legacyKey) : null;
  if (generation !== epoch) throw new Error("Session changed while unlocking data.");
  keys = { userId, current, legacy };
}

function toB64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromB64(value) { return Uint8Array.from(atob(value), (c) => c.charCodeAt(0)); }
async function importKey(value) {
  const raw = fromB64(value);
  if (raw.length !== 32) throw new Error("Invalid encryption key.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptValue(value) {
  const active = keys;
  if (!active) throw new Error("Your financial data is locked.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(`ledger:v2:${active.userId}`) },
    active.current, new TextEncoder().encode(JSON.stringify(value)),
  );
  return `enc2:${toB64(iv)}.${toB64(new Uint8Array(ciphertext))}`;
}

export async function decryptValue(value) {
  if (value == null) return value;
  const active = keys;
  if (!active) throw new Error("Your financial data is locked.");
  const str = String(value);
  if (!str.startsWith("enc:") && !str.startsWith("enc2:")) {
    // Explicit legacy compatibility, used only until the transactional upgrade.
    try { return JSON.parse(str); } catch { return str; }
  }
  const v2 = str.startsWith("enc2:");
  const key = v2 ? active.current : active.legacy;
  if (!key) throw new Error("Legacy data needs its original encryption key. No records were changed.");
  try {
    const parts = str.slice(v2 ? 5 : 4).split(".");
    if (parts.length !== 2) throw new Error();
    const iv = fromB64(parts[0]);
    if (iv.length !== 12) throw new Error();
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv,
      ...(v2 ? { additionalData: new TextEncoder().encode(`ledger:v2:${active.userId}`) } : {}),
    }, key, fromB64(parts[1]));
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    // Never turn a bad decryption into null/zero and then save over the original.
    throw new Error("A saved value could not be decrypted. No records were changed.");
  }
}

export async function encryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) if (result[field] != null) result[field] = await encryptValue(result[field]);
  return result;
}
export async function decryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) if (result[field] != null) result[field] = await decryptValue(result[field]);
  return result;
}

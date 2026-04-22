const APP_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || "";

let _key = null;

// Derives a per-user AES-GCM-256 key from userId + app secret via PBKDF2.
// Call once after login; the key is kept in memory only.
export async function initCrypto(userId) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(userId + APP_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  _key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(userId),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function clearCrypto() {
  _key = null;
}

function toB64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromB64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

// Encrypts any JSON-serialisable value. Returns "enc:<ivB64>.<ciphertextB64>".
export async function encryptValue(value) {
  if (!_key) throw new Error("Crypto not initialised — call initCrypto first");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    _key,
    new TextEncoder().encode(JSON.stringify(value))
  );
  return `enc:${toB64(iv)}.${toB64(new Uint8Array(ciphertext))}`;
}

// Decrypts an encrypted value and returns the original typed value.
// If the value is not in "enc:..." format (legacy unencrypted data), it is
// returned as-is after a best-effort JSON.parse for type preservation.
export async function decryptValue(value) {
  if (value == null) return value;
  const str = String(value);
  if (str === "") return str;
  if (!str.startsWith("enc:")) {
    try { return JSON.parse(str); } catch { return str; }
  }
  if (!_key) throw new Error("Crypto not initialised — call initCrypto first");
  const rest = str.slice(4); // strip "enc:"
  const dot = rest.indexOf(".");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(rest.slice(0, dot)) },
    _key,
    fromB64(rest.slice(dot + 1))
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function encryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] != null) {
      result[field] = await encryptValue(result[field]);
    }
  }
  return result;
}

export async function decryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] != null) {
      result[field] = await decryptValue(result[field]);
    }
  }
  return result;
}

import { hkdfSync, pbkdf2Sync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function createKeyHandler({ env = process.env, clientFactory = createClient } = {}) {
  return async function keyHandler(req, res) {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const reject = (status, message) => res.status(status).json({ error: message });
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return reject(405, "Method not allowed."); }
    // No CORS: only the same-origin application may request key material.
    if (req.headers.origin && req.headers.origin !== `https://${req.headers.host}` && !(env.NODE_ENV === "development" && req.headers.origin === `http://${req.headers.host}`)) return reject(403, "Origin not allowed.");
    const token = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || "")?.[1];
    if (!token || token.length > 8192) return reject(401, "Sign in to continue.");
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const anonKey = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const master = env.ENCRYPTION_MASTER_KEY;
    if (!url || !anonKey || !/^[A-Za-z0-9_-]{43}$/.test(master || "") || Buffer.from(master, "base64url").length !== 32) return reject(503, "Secure data access is not configured.");
    let projectRef;
    try {
      const endpoint = new URL(url);
      if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.supabase.co')) return reject(503, "Invalid secure data configuration.");
      projectRef = endpoint.hostname.split('.')[0];
    } catch { return reject(503, "Invalid secure data configuration."); }
    // Shared live data must never be reachable through a preview key service.
    if (env.VERCEL_ENV === "preview" && (!env.PRODUCTION_SUPABASE_PROJECT_REF || !env.PREVIEW_SUPABASE_PROJECT_REF || projectRef !== env.PREVIEW_SUPABASE_PROJECT_REF || projectRef === env.PRODUCTION_SUPABASE_PROJECT_REF)) return reject(503, "An isolated preview database is required.");
    try {
      const client = clientFactory(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data, error } = await client.auth.getUser(token);
      if (error || !data?.user?.id) return reject(401, "Your session has expired. Sign in again.");
      const user = data.user;
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      if (claims.sub !== user.id) return reject(401, "Invalid session.");
      if (user.factors?.some((factor) => factor.status === "verified") && claims.aal !== "aal2") return reject(403, "Verify your authenticator code to continue.");
      const { data: sessionAllowed, error: sessionError } = await client.rpc('authorize_key_access');
      if (sessionAllowed?.rateLimited) { res.setHeader('Retry-After', '60'); return reject(429, 'Too many unlock requests. Try again in a minute.'); }
      if (sessionError || sessionAllowed?.allowed !== true) return reject(403, "Your session needs verification. Sign in again.");
      const key = Buffer.from(hkdfSync("sha256", Buffer.from(master, "base64url"), Buffer.from(user.id), Buffer.from("ledger-financial-data-v2"), 32)).toString("base64");
      // Compatibility is server-side only. Never send the shared legacy secret.
      const legacySecret = env.LEGACY_ENCRYPTION_SECRET;
      const legacyKey = legacySecret === undefined ? null : pbkdf2Sync(user.id + legacySecret, user.id, 100000, 32, "sha256").toString("base64");
      return res.status(200).json({ userId: user.id, version: 2, key, legacyKey });
    } catch {
      // Do not log tokens, key material, or provider responses.
      return reject(503, "Secure data access is temporarily unavailable.");
    }
  };
}

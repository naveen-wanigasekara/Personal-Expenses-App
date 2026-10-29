# Security hardening implementation and rollout

This branch is a candidate for isolated-environment testing, not an authorization
to merge or release to production. The live database and production settings have
not been changed. The approved design preview must remain usable during setup.

## Implemented boundaries

- `api/crypto-key.js` verifies the Supabase access token and a live database
  session before delivering a key for that user. Verified MFA factors require
  `aal2`. Key requests are limited to 20 per account per minute in the database. Responses are private, noncacheable, same-origin, and POST-only.
- `ENCRYPTION_MASTER_KEY` is server-only, separate from Supabase. HKDF-SHA-256
  derives a per-user AES-256-GCM key. The browser holds only its own key in memory.
  User ID is authenticated as AES-GCM additional data. This is server-managed
  encryption, **not end-to-end encryption**; a compromised application server or
  unlocked device remains a risk.
- Historical `enc:` data is decrypted using its original user-derived key,
  obtained from the authenticated server endpoint. The shared legacy secret is
  no longer included in browser code. All new writes use `enc2:`.
- On first authenticated access, all eight tables' encrypted fields, including
  bank details, are preflighted before writes and upgraded in bounded, resumable transactions. Raw source snapshots must match;
  bad preflight decryption prevents any writes, and a stale row rolls back its whole
  batch. Each committed batch stays readable after an interrupted upgrade. A
  database guard rejects legacy writes from the first batch onward; completion is
  recorded only after every encrypted field is converted.
  Old database snapshots/backups retain the historical encryption weakness.
- Multi-row investment/history and installment operations use an allowlisted,
  ownership-checked transaction RPC. Raw snapshots provide optimistic concurrency
  checks. Missing rows or any failed operation roll back the batch. Uncertain
  acknowledgements require a refresh rather than another write from stale UI state.
- Database triggers cover direct API writes too: same-owner references when created/reassigned, 256 KiB
  rows, a 50 MiB account storage cap, table-specific record counts, and 600 writes
  per minute. Per-user advisory locks serialize quota checks.
- Restrictive RLS checks require a live session and MFA for enrolled users.
  Revoked sessions lose database access even before JWT expiry. Anonymous table
  grants and unnecessary TRUNCATE/TRIGGER/REFERENCES grants are removed.
- Recovery links open a dedicated new-password/confirmation screen. New passwords
  require 12–128 characters; old passwords remain usable for existing sign-in.
  Profile/Account offers authenticator enrollment and signin supports MFA.
- The service worker caches only build-listed public assets, never API data.
  Activation and logout purge legacy Supabase caches. Public offline shell,
  install manifest, app updates, and theme behavior remain supported.
- Vercel headers prohibit framing, inline/evaluated scripts, objects and external
  form submissions, and limit connections/resources. Referrer, MIME and device
  permission policies are explicit.
- Preview builds AND the server key endpoint refuse a shared production backend.
- Exact dependency versions and lockfile are committed. The obsolete Workbox
  build pipeline was removed because its remaining deepmerge advisory has no
  upstream patched release. A small tested public-asset-only worker replaces it.
- CI uses pinned GitHub Actions, read-only contents permission, and no stored
  checkout credentials. It runs build/tests and rejects any npm audit advisory.
  Dependabot updates application dependencies and Actions weekly.

## Isolated setup and remaining release checks

Supabase branching required a paid plan. The owner instead supplied a separate
`dev-expense-app` project. Its schema and security rollout are now applied, with
branch-specific Vercel preview configuration and fresh dev-only encryption keys.
No production records or secrets were copied, and production remains unchanged.

1. In the isolated project, apply `db/schema.sql`, `db/schema_migration.sql`, then
   `db/security_hardening.sql`, and verify its advisor notices. The last file is a
   transactional SQL rollout script, not an already-applied migration. CLI
   migration generation was unavailable in this environment.
2. Configure the frontend AND server variables from `.env.example` for that
   isolated project only. Generate a random 32-byte master and retain it securely.
   Never copy production financial data or keys into QA. Use a synthetic legacy
   fixture with its own legacy secret to verify migration.
3. Apply Auth settings in the dashboard: minimum password length 12; enable TOTP
   enrollment/verification; require reauthentication for password changes; review
   JWT/session lifetimes and Auth rate limits; configure bot protection. Enable
   leaked-password protection on an eligible plan. These provider settings are
   not changed by frontend validation or the database SQL.
4. Allow the exact QA origin as an Auth redirect, including `/?flow=recovery`.
   Test delivered confirmation and recovery links and expired/reused links.
5. Run browser QA against the isolated deployment: signup, confirmation, signin,
   MFA enrollment/challenge, recovery/password change, signout, crypto upgrade,
   bank details and all financial operations. Test installed-PWA cache cleanup,
   offline behavior, and mobile keyboard/form behavior on a physical device.
6. In GitHub settings, protect `main`: require PRs and the `test-and-audit` status
   check, require code-owner review, block force pushes/deletion, and restrict
   bypasses. CODEOWNERS and workflow source do not themselves enable protection.
   The connected code tools do not expose branch-protection administration.

## Production release requires a separate approval

Before any release, verify a restorable backup and a securely retained master
key. Retain the exact historical secret as server-only `LEGACY_ENCRYPTION_SECRET`
until all active accounts' legacy fields have been converted. Never rotate keys
in-place or relabel ciphertext without decrypting/re-encrypting it.

Run the SQL against production only as part of an approved coordinated release;
its session and ciphertext guards affect older clients. Require those clients to
update. Confirm encryption upgrades for each account before retiring legacy-key
support. Re-encrypting current rows does not retroactively protect old backups.

A rollback after migration must retain the new key service and `enc2:` reader;
rolling back to the old ID-derived encryption implementation would make migrated
records unreadable. Do not weaken the data guards as a rollback shortcut.

Operational follow-up: verify platform administrative MFA, backup restoration,
security alerts, usage monitoring, and incident response. Per-account caps do not
replace signup-abuse prevention, request throttling, monitoring or provider limits.

## Verification

Local automated checks cover encryption/key isolation, corrupt/legacy ciphertext,
logout races, migration preflight and transactional batch behavior, bank details, RPC ownership,
missing/stale rows, upserts, deleted-card history, large resumable migrations, rollback, direct-write limits, MFA, session revocation, service
worker private-request behavior, and existing financial/theme tests. PostgreSQL
semantics are exercised in PGlite with explicit anon/authenticated roles and mock
Auth tables. This is not a substitute for hosted Supabase/PostgREST/browser QA.

Run `npm ci --ignore-scripts`, `npm test` (includes the production build),
`npm audit --audit-level=low`, and `git diff --check`.

### Local result (2026-10-29)

- Production build passed on Node 24.
- 68 Node tests and 9 React/provider-mocked UI tests passed (77 total).
- npm audit: 0 known vulnerabilities, including development dependencies.
- Shared-production preview configuration was rejected before compilation.
- A build with synthetic legacy/master secret sentinels did not expose either
  value in client JavaScript. Every worker-listed public file exists.
- Independent review identified upsert-accounting, deleted-card-history and
  large-migration regressions; focused reproductions now pass after corrections.
- Live Auth schema column compatibility was checked read-only. No production
  database, Auth setting, key configuration or deployment was modified.

### Hosted dev verification (2026-10-29)

- The isolated security preview built successfully and reached READY. Auth site
  URL and exact preview/recovery redirects were saved. Minimum password length
  is 12; email confirmation stays enabled and TOTP is enabled by the provider.
- Owner-created test-account sign-in, key unlock, saved-record reload, income,
  cash/card purchases, card setup, installment creation/editing, ledger search
  and transaction editing, recurring reminders, fixed budget, bank detail saving
  and copy feedback, investment creation and valuation updates passed in-browser.
- Loan calculations returned 10,000/month at 0% and 10,661.85/month with
  7,942.26 total interest at 12% for a 120,000 loan repaid over 12 months.
- All eight public tables contain synthetic test records. Sample sensitive
  fields in each were checked server-side and use `enc2:` ciphertext. Reload
  correctly restored decrypted values and balances in the browser.
- Hosted PostgreSQL assertions passed for owner writes, cross-user read/delete
  denial, anonymous denial, failed-batch atomic rollback, stale-snapshot rejection,
  plaintext-write rejection, write/key quotas, and revoked-session read/key denial.
  These tests set synthetic claims under database roles rather than forging real
  JWTs. Synthetic auth/session fixtures and mutations were fully rolled back.
- In-browser installment testing found an ambiguous amount input. It now explicitly
  labels the field "Monthly installment amount"; financial calculations are unchanged.

The owner enrolled a TOTP authenticator; the dev Auth database confirms one
verified factor. A pre-enrollment browser session then correctly failed closed,
but displayed a generic lock error because the default assurance lookup used
cached factors. Bootstrap now supplies the access token to the provider's
assurance API, which validates it and fetches current factors. Two regression
cases cover newly enrolled factors and a failed live verification. The local
suite now contains 79 tests (68 Node and 11 React/provider-mocked UI tests).

Hosted MFA challenge completed successfully on the corrected preview: password
sign-in stopped at the authenticator gate, the owner securely provided the code,
and the financial workspace unlocked with existing records intact. Reload
preserved the verified session. Global signout returned to the sign-in screen
and reduced the test account's server-side session count from two to zero.
The enrolled account was also checked using hosted database role assertions:
AAL1 could access neither records nor keys; AAL2 could read its own test records.
Those assertions used synthetic claims and persisted no changes.

Remaining before production release: recovery/email delivery, legacy-data upgrade
in a hosted fixture, physical-device
PWA/offline/private-cache and keyboard checks, provider password-reauthentication
policy/rate-limit review, and GitHub branch protection verification. Local mocked
tests and database role tests do not replace those checks or guarantee security.

### Protected-preview PWA manifest

The owner's Android Chrome screenshot showed installation disabled with a generic
site icon. Vercel project inspection confirms authentication protects preview
URLs. The manifest itself returns valid JSON through authenticated access, but
the HTML link omitted `crossorigin="use-credentials"`, which authenticated
manifest fetches require even on the same origin. The same-origin link now
includes it. Deployment protection and application data access are unchanged.
An Android installation retry is still required; this change does not prove
WebAPK creation or physical-device installation succeeded.

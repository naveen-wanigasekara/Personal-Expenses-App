# Desktop UI-only release candidate

Status: DRAFT — prepared for review, not approved for production.

## Scope

Base: live main commit `59c0689f7fd924db9ac2a5b65e8ad40de3a39c11`.
Branch: `release/desktop-ui-only`.

The only application changes are `src/styles/desktop.css` and one import in
`src/main.jsx`. The added stylesheet applies exclusively at 1024px and wider.
It provides the mint desktop palette, aligned dashboard grid, readable charts,
consistent gutters, navigation, form/dialog sizing, and Customize stacking fix.
Phone and tablet styles below 1024px retain the production appearance.

All existing production components, authentication, financial calculations,
Supabase client, encryption, schema, settings, package/lock files, PWA manifest,
service worker configuration and storage code are unchanged. No migration,
reset, new encryption keys, authentication setting changes or database writes
are required by this UI release. New features present on the security/design
branches (loan calculator, bank details, themes and security changes) are not
included. No other branch should be merged as part of this release.

## Verification — 2026-10-29

- `npm ci --ignore-scripts --no-fund --no-audit`: passed using unchanged lockfile.
- `npm run build`: passed, including the existing Workbox PWA generation.
- `node --test tests/desktopRelease.test.js`: four tests passed. They check all
  existing tracked files byte-for-byte against production (except the exact
  stylesheet import), desktop-only CSS boundaries including root variables,
  Customize stacking, and dialog/chart sizing declarations.
- These are source/build checks, not browser rendering or end-to-end tests.
  The previous redesign's browser tests do not validate this different base.
  Fresh desktop/mobile visual and interaction testing is still required;
  browser access was previously blocked by automatic approval review because
  workspace credits were exhausted. No alternate browser path was used.
- `npm audit`: failed on the unchanged production lockfile: 18 advisories
  (10 high, 5 moderate, 3 low, 0 critical). These are not introduced by this
  stylesheet; they remain unresolved. Severity is the dependency scanner's
  classification, not proof each advisory is exploitable in the deployed app.
  The required CI job retains a strict audit gate; it is not bypassed.

## Before approving production

1. Resolve the dependency audit in a separately tested compatibility change.
2. Complete real browser checks at phone/tablet widths below 1024px and desktop
   widths 1024/1280/1440/1920px: dashboard, customized/reordered sections,
   charts, ledger, budget, cards/investment master-detail, settings and long
   forms/dialogs including Customize. Check zoom/short windows and Save reachability.
3. Reconfirm production still points at the baseline before choosing the final
   candidate; rerun these checks if main or the candidate changes.
4. Verify current recovery coverage and securely retain the exact production
   encryption secret. Use the existing production project, database, domain,
   environment values and PWA identity. Never apply preview values to production.
5. Obtain the owner's explicit deployment approval. Merge only this reviewed
   candidate through protected main; do not promote the security preview.
6. After deployment, verify existing account sign-in and saved records/settings,
   ordinary create/edit workflows, and PWA refresh. Monitor errors. Routine
   user writes may change counts; aggregate counts alone cannot prove integrity.

This CSS-only release requires no stored-record conversion, so reverting its
frontend remains compatible with the existing database. Existing auto-update
behavior is unchanged; a reload can still interrupt unsaved form input. No
zero-risk/no-disruption guarantee is made.

## Separate security release — mandatory prerequisites

Keep `security/hardening` and draft PR #8 separate. No production SQL, encryption,
Auth, environment or security rollout has been performed for this UI candidate.

Before that release:

- Confirm a current production backup covers all eight finance/settings tables,
  relationships and Auth accounts/identities. Record recovery point and recovery
  procedure. Securely preserve the original encryption secret and future master
  key independently of the database; a database backup alone is insufficient.
- Restore into a private, isolated environment with production email delivery,
  webhooks and other outward side effects disabled. Do not overwrite either the
  live project or the existing development project. Handle copied user data as
  production-sensitive; restrict access and set a cleanup policy.
- Verify actual legacy-secret compatibility in that environment, migrate every
  encrypted table, and compare logical values, identifiers, relationships,
  settings, record counts and account continuity before/after. Verify retry,
  interrupted migration, stale-client writes and concurrent access behavior.
- Test existing installed PWAs and open tabs through cutover. An intermediate
  compatible client/update gate is needed before enforcing incompatible writes.
- Rehearse a rollback that retains the new key service and enc2 reader. The
  currently deployed old client cannot read migrated enc2 records.
- Verify production-specific server configuration, database functions/RLS,
  password-reset email delivery, session/MFA behavior and user workflows.
- Present the rehearsal evidence and exact rollout/rollback sequence for a
  fresh explicit production approval. No schema reset/replacement is acceptable.

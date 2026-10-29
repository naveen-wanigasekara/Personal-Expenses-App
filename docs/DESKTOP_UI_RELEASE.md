# Desktop UI-only release candidate

Status: HOLD — owner has authorized deployment only after safety is verified.
Current remaining gate: verified recovery backup and isolated restore; paid
provider recovery setup requires a PM budget decision.
Production remains unchanged because the verification gates below are unresolved.

## Scope

Base: live main commit `59c0689f7fd924db9ac2a5b65e8ad40de3a39c11`.
Branch: `release/desktop-ui-only`.

The only application-source changes are `src/styles/desktop.css` and one import in
`src/main.jsx`. The added stylesheet applies exclusively at 1024px and wider.
It provides the mint desktop palette, aligned dashboard grid, readable charts,
consistent gutters, navigation, form/dialog sizing, and Customize stacking fix.
Phone and tablet styles below 1024px retain the production appearance.

All existing production components, authentication, financial calculations,
Supabase client, encryption, schema, settings, PWA manifest,
cache rules and application storage code are unchanged. Worker activation now
uses the existing refresh prompt instead of automatically interrupting open tabs. Build dependencies and
the JSX compiler have been updated separately on this branch to address the
failed audit; this is no longer a stylesheet-only repository diff. No migration,
reset, new encryption keys, authentication setting changes or database writes
are required by this UI release. New features present on the security/design
branches (loan calculator, bank details, themes and security changes) are not
included. No other branch should be merged as part of this release.

## Verification — 2026-10-29

- `npm ci --ignore-scripts --no-fund --no-audit`: passed with the updated lockfile.
- `npm run build`: passed, including the existing Workbox PWA generation.
- `node --test tests/desktopRelease.test.js`: 12 tests passed. They check all
  existing application/data files byte-for-byte against production (except the
  exact stylesheet import), desktop-only CSS boundaries including root variables,
  Customize stacking, dialog/chart sizing, production client version/integrity
  compatibility, legacy encryption round trips and built PWA identity/settings.
- These are source/build checks, not browser rendering or end-to-end tests.
  The previous redesign's browser tests do not validate this different base.
  Desktop visual and read-only interaction checks have now resumed after
  secure Vercel/Google and expense-app authentication. Mobile/multiple desktop
  viewport checks and write workflows remain pending. The prior credit block
  did not recur. No protection bypass/share link was created.
- Build tooling now uses pinned Vite 8.3.5, vite-plugin-pwa 2.0.0 and PostCSS
  8.5.32 on Node 24. The superseded React build plugin was removed; Vite's native
  automatic JSX compiler is used. Production is already configured for Node 24.
- Direct client dependencies are pinned to their exact existing lockfile versions:
  Supabase JS 2.104.0, React/ReactDOM 18.3.1 and lucide-react 0.383.0. Existing
  runtime dependency versions/integrities are retained except `ws` 8.20.0 to
  8.22.0, which resolves its high/moderate advisories. This is the Node WebSocket
  fallback dependency; browsers use their native WebSocket implementation.
- `npm audit`: reduced from 18 advisories (10 high, 5 moderate, 3 low) to four
  low advisories, zero high/moderate/critical. The four remaining entries are the
  deepmerge prototype-poisoning advisory and three affected dependents in the
  Workbox build chain. The current published deepmerge 4.3.1 is still affected.
  No downgrade, audit suppression or relaxed gate was used. The strict low-level
  audit gate remains a blocker; dependency classification alone does not prove
  exposure in the deployed app.
- Production database is ACTIVE_HEALTHY. Its organization reports the Free plan.
  Supabase documents automatic daily backups for paid plans and recommends manual
  off-site exports for Free projects. No complete backup or successful isolated
  restore is verified here. The connected tools expose no backup-list/export
  capability; no production restore, schema change or record mutation was run.

## Before production

1. DONE: resolve the build-chain audit through a tested local security patch;
   the unchanged strict audit gate now passes with zero advisories.
2. Complete real browser checks at phone/tablet widths below 1024px and desktop
   widths 1024/1280/1440/1920px: dashboard, customized/reordered sections,
   charts, ledger, budget, cards/investment master-detail, settings and long
   forms/dialogs including Customize. Check zoom/short windows and Save reachability.
3. Reconfirm production still points at the baseline before choosing the final
   candidate; rerun these checks if main or the candidate changes.
4. Verify current recovery coverage and securely retain the exact production
   encryption secret. Use the existing production project, database, domain,
   environment values and PWA identity. Never apply preview values to production.
5. The owner's conditional authorization is already recorded. Deploy only once
   these safety gates are met. Merge only this candidate through protected main;
   do not promote the security preview or waive checks to force a release.
6. After deployment, verify existing account sign-in and saved records/settings,
   ordinary create/edit workflows, and PWA refresh. Monitor errors. Routine
   user writes may change counts; aggregate counts alone cannot prove integrity.

This CSS-only release requires no stored-record conversion, so reverting its
frontend remains compatible with the existing database. The worker now waits for the existing Refresh action instead of automatically
reloading active tabs. Users must finish unsaved work before clicking Refresh. No
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


## Authenticated browser follow-up — 2026-10-29

Private release preview e0feb234 opened successfully after owner-approved Google
sign-in and device verification. The expense app separately authenticated through
its secure login prompt. Existing financial records, card balances, budget values,
investment history and saved section visibility/order rendered successfully.

Checks performed at the available 1363 x 936 desktop viewport:

- Dashboard loaded with no horizontal viewport overflow.
- Customize title/close button and complete dialog were visible above the sticky
  header/sidebar; opening/closing did not change saved layout.
- Ledger search displayed the empty result and clear restored the 113 visible
  October transactions. No transaction was changed.
- Cards and investments opened their existing master/detail views without
  horizontal overflow; the card activity detail pane was scrollable.
- Budget loaded the existing plan; Save fixed plan was reachable at the bottom
  after scrolling/keyboard navigation. No budget input was changed or saved.
- All five entry modes opened; Record stayed in the viewport. A synthetic amount
  and note were entered only into an unsaved dialog; Record was never submitted
  and the draft was discarded.
- Account/settings opened read-only, displaying existing currency/account state.
- Captured console errors from the browser extension/Google login were present,
  but none of the captured errors were attributed to the preview app origin.
  This is a scoped observation, not proof of error-free operation.

One desktop issue was found: investment-card text was low contrast on a bright
mint background. The desktop-only stylesheet now uses a darker green gradient
and opaque light labels; a new test checks >=4.5:1 contrast at both endpoints.
Preview commit 0ca1ac0 was visually retested after refresh: both investment
card/detail surfaces use the intended dark gradient and readable labels, with no
horizontal viewport overflow. The authenticated session survived refresh.

This does not prove full data integrity or successful create/edit/delete flows.
No production finance/settings records were written, deleted, migrated or reset.
No complete mobile/multi-viewport browser test, backup or restore rehearsal has
been completed. Production deployment remains on hold.


## Final preparation follow-up — 2026-10-29

### Dependency blocker resolved

The remaining GHSA-gcqx-w48m-w2h4 build-chain issue has no upstream fixed release.
A clearly identified local MIT-licensed deepmerge 4.3.1 fork is now pinned under
`vendor/deepmerge`, with its original source hash and license retained. The patch
rejects prototype control keys on BOTH source and target copy paths. The original
null-prototype-input proof reproduces poisoning; the patched version blocks it.
Tests cover poisoned source/target/nested inputs, normal options, array merges,
symbols, special values, cloning and custom merge callbacks. This is a real local
patch, not an advisory suppression or a claimed upstream release. Future upstream
updates require review so the maintained fork can be removed safely.

Clean install, production/PWA build, all 12 focused tests and the unchanged strict
`npm audit --audit-level=low` gate pass (zero reported advisories). Browser JS/CSS
asset hashes remain identical to the previously visually tested contrast build;
the patched merge is build-only. This does not imply comprehensive security.

### Responsive and synthetic workflow checks

An isolated local fixture rendered the actual baseline application components
and candidate stylesheet side by side. The entire Supabase module was aliased to
in-memory synthetic records, with no production URL/key or database connection.
The fixture is outside the repository and is not part of the release.

- 24 mobile/tablet comparisons: six screens (Insights, Ledger, Cards, Profile,
  Budget, Investments) at 390, 412, 768 and 1023 CSS pixels. Element geometry and
  14 computed layout/typography/color properties match the production baseline;
  no candidate horizontal viewport overflow. Animations/transitions were disabled
  equally in both fixture frames to compare steady-state layout rather than
  differing animation timing. The initial card comparison mismatch disappeared
  after this normalization; no mobile stylesheet change was needed.
- 20 desktop checks: five screens (Insights, Ledger, Cards, Budget, Investments)
  at 1024, 1280, 1440 and 1920 CSS pixels. No horizontal viewport overflow. Bar
  chart height is 210px at laptop widths and 240px at 1920px.
- Phone workflow at 390px: created a synthetic transaction for 123.45, found it
  through search, edited it to 199.95, saved and verified the updated display,
  then deleted it and verified the empty result/count returned to the fixture's
  two baseline transactions. These operations touched only in-memory fixture data.

These iframe-based browser checks verify responsive CSS and real component
interactions. They do not emulate a physical mobile keyboard, prove server write
behavior or replace the previously completed hosted read-only checks.

### Recovery remains a release gate

No production backup, restore, schema change, authentication-setting change or
financial/settings record mutation has been performed. The complete provider
backup/export connection is not available through the current connected tools.
An ad-hoc row export is not being substituted for a complete recovery backup.
The Free organization contains both expenses-app and dev-expense-app.

Provider-supported options:

- Free: a full logical backup using an existing secure database connection,
  including provider-supported role/schema/data export and a restore test.
  That secure connection is not currently provisioned here; do not reset database
  credentials or ask for passwords in chat to manufacture access.
- Paid: organization Pro (base $25/month, one Micro project covered); with the
  two existing projects, the baseline estimate is about $35/month before usage.
  Daily backups retain seven days. A temporary new project for a restore drill
  adds hourly compute and must be cost-approved before creating it. Native
  restore-to-new-project copies database/Auth records and permissions; Storage,
  Auth configuration/API keys and the app's separate encryption secret still
  need explicit preservation/reconfiguration checks. PITR is not required for
  this proposed daily-backup path and is not included in the estimate.

References checked: https://supabase.com/pricing,
https://supabase.com/docs/guides/platform/backups,
https://supabase.com/docs/guides/platform/clone-project.

A PM budget decision is needed before incurring paid backup/restore costs.
Conditional deployment authorization is already granted; no repeat routine
release approval is needed once the remaining safety conditions are verified.
Until then: no merge or production deployment, and keep security PR #8 separate.


### PWA update activation safeguard

The installed app previously generated a skip-waiting worker, which could trigger
its existing controller-change reload while a user was filling a form. The new
build uses `registerType: prompt`. The generated worker listens for the existing
SKIP_WAITING message, and no longer automatically claims active clients. The
already-shipped PWABanners/usePWA code displays the existing refresh prompt and
sends that message only on the user's Refresh action. A worker may also activate
normally once old clients have closed. No mobile markup, layout, cache rules,
manifest identity, financial logic or stored-record format changed.

Generated-worker tests assert the message activation path and absence of automatic
clientsClaim, and the exact configuration diff is checked. JS/CSS application
asset hashes remain the same as the visually tested contrast build. Full physical
installed-PWA cutover verification remains required before final rollout; this
safeguard does not recover a draft if the user explicitly refreshes it.

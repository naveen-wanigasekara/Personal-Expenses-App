# Combined development preview

This integration combines the existing dev branch with all completed work from:

- dev: ff50d54e69d6e572c1860d301c344cae444246e0
- security/hardening: 22ffc7019fe6438de8b088c70cb399c1d1f23745
- design/premium-fintech-refresh: 352f8b76f931edd3716748b0a003ce6d6771c2b7
  (already an ancestor of the security branch)
- release/desktop-ui-only: 3fb9dba75b1668ac0f633e46517729613819fb2c

## Included work

Premium design, light/dark/system appearance, desktop grid/charts/spacing,
Customize stacking and investment contrast fixes, loan calculator with total
interest, encrypted bank details, date/money/installment corrections, recovery
and MFA screens, authenticated key delivery, per-user versioned encryption,
atomic optimistic batch writes, database ownership/session/MFA/quotas, cache
privacy safeguards, and update activation that waits for the Refresh action.

The security branch already removed the vulnerable Workbox build dependency
chain. Its Vite 8/native JSX build and pinned dependencies are retained instead
of reintroducing that older toolchain. The release branch's local deepmerge fork
and tests remain in the tree as maintenance evidence, but the integrated build
does not use that dependency chain. Production-baseline equality tests are
retained under tests/release; those assertions belong to the UI-only release,
not an integration that intentionally adds backend/authentication functionality.

## Data and deployment boundary

The owner clarified that dev previously inherited production database settings.
This combined version must NOT be deployed against that production connection.
Production lacks its required key/session/batch database functions. No production
schema, data, Auth setting, environment value, deployment or domain was changed.

Only branch-specific PREVIEW variables were re-scoped from security/hardening to
dev, using the previously authorized isolated project dev-expense-app
(blibolmxjqkgqiylrgib). Existing master/legacy key VALUES were preserved by editing
only gitBranch; no keys were read, regenerated or rotated. Production-targeted
variables were checked unchanged. The frontend public URL was checked against
the isolated project ref. Build isolation still refuses a production or mismatched
backend before login. The existing test database already has all required
security functions/state; no database migration or record mutation was executed
for this merge. Old deployed security previews retain their deployed environment;
future builds of that retired branch require their own scoped configuration.

The dev preview shows test data. Production records are not copied into it.
Production stays on main 59c0689f7fd924db9ac2a5b65e8ad40de3a39c11.

## Validation

Clean install, Vite build, 77 Node tests, 11 React UI tests, and strict dependency
audit passed (88 total, zero reported dependency vulnerabilities). Tests include
owner boundaries, migration retry/rollback, stale snapshots, encryption, bank
storage, loan math, theme behavior, mobile dialog stacking and explicit worker
activation. Prior hosted/synthetic results and limits are in the existing UI and
security documents. These checks do not certify a production migration or every
physical-PWA/email recovery flow. Password-reset delivery/callback settings for
the newly assigned dev URL still need a hosted review.

## Production gate

This is a DEVELOPMENT/PREVIEW release only. Production backup/restore and legacy
client compatibility work remain separate. Nothing here authorizes a production
deployment or running db/security_hardening.sql against the live database.

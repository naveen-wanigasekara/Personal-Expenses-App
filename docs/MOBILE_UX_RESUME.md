# Paused mobile UX work - 27 November 2026

Originally paused at the user's request; resumed on 27 November 2026. The notes below preserve the earlier checkpoint. See MOBILE_UX_QA.md for current progress.

## Branch and scope
- Local branch: fix/mobile-ux-review; base dev b018f5543439e922e15dab75c3db4fc2887501f1.
- Work is checkpointed locally only. No remote branch/PR was created for this work.
- No merge into dev, production deployment, database migration or live financial-data write.
- User requires all agreed tests to pass before merging. Never describe physical device/PWA checks as completed without evidence.

## Implemented so far
- Monetary search normalization; historical budget scope/save labels.
- Shared in-memory draft/discard and beforeunload guards for create/edit sheets; entry-subtype navigation and explicit update guard.
- Budget dirty-state guard and a new app Back/layer hook (needs dedicated tests and browser review).
- Mobile hit areas, readable input/label sizes and constrained-height sheet styling.
- Current secondary destination marker in Menu.
- Card-detail Record payment action with card preselection and available-credit explanation.
- Compact mobile reports toggle and read-only savings activity from existing balance projections.
- Loan due-status filtering and payment-priority sorting; repayment selector includes purpose notes.
- Notification dismissal semantics and leading explanations; installation instructions and manifest branding.
- Offline guidance; app update controller-change avoids reloading a changed draft.

## Verification at pause
- Latest npm test completed successfully: production build, 132 Node tests + 110 React tests = 242 passing, zero failures/skips.
- Latest log: /tmp/mobile-ux-full-4.log (temporary; may disappear).
- Earlier npm audit passed with zero vulnerabilities; rerun after remaining changes.
- git diff --check passed.
- Test logs include jsdom's not-implemented window.confirm warning in older fixtures. Identify and explicitly model confirmation in those fixtures rather than hiding warnings.
- New regression tests live in tests/mobileUx.ui.test.jsx and tests/transactionSearch.test.js; moneyFlows includes contextual payment and savings history assertions.
- The Back hook, budget guard and final layout changes still need dedicated behavioral tests. Passing existing tests is not certification of those new paths.
- No live browser test has run against this new code. No physical iPhone/Samsung, installed PWA, real offline/reconnect, system Back or cross-device tests were performed.

## Next steps
1. Review the current patch; add focused Back/layer, pending/rejected-save, budget navigation, compact dashboard, PWA update and responsive checks. Check dirty-state cancellation/confirmation, nested layers, root exit and history cleanup.
2. Review potential gaps: color/type-only form changes, pending bank writes, changed budget drafts during prop refresh, offline save behavior, and short-viewport navigation overlap. Do not claim every UX finding resolved yet.
3. Run build, full suite, audit and whitespace checks after final edits.
4. Publish a draft development PR/preview using GitHub connector if shell push lacks credentials; inspect remote dev before writing. Tools create_tree/create_commit/create_branch/update_ref are available. Base tree currently d38a22456a2fe2f0d8213038ff9b01e5f10d0915.
5. Verify the final immutable preview against isolated development backend. Browser plugin js is unavailable; use CUA only after its browser guidance. Prior browser has tab 3 for an older immutable preview; that tab does not contain these new changes.
6. Keep test coverage limits explicit. Do not merge until the user's test condition is met; do not deploy production.

## Existing review artifact
Finance_App_Mobile_UX_Review_2026-11-26.pdf, Library ID libfile_e2818825e2f88191adf6907cd6786bbd. Contains 18 findings and eight proposals. New feature proposals are not all implemented in this patch.

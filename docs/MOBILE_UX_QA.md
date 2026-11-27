# Mobile UX fixes - 27 November 2026

Development integration only. Base: dev b018f5543439e922e15dab75c3db4fc2887501f1.
No production, schema, authentication-policy or financial-data changes.

## Automated evidence

The current local build and complete suite pass: 134 Node tests and 121 React
tests (255 total), with zero failures, cancellations or skipped tests. The full
dependency audit reports zero vulnerabilities; whitespace checks pass.

New checks cover formatted amount queries, text-search separation, historical
budget labels, Close/Escape/backdrop discard cancellation and confirmation,
type-only edits, entry subtype navigation, beforeunload cleanup, offline entry
retries, bank writes without fieldsets, PWA explicit-update cancellation and
cross-tab activation deferral. Back tests cover nested sheets, details, tab
history, dirty budget cancellation, root exit and listener cleanup. Budget
refresh and Copy-from-fixed tests protect unfinished work. MainApp tests cover
contextual card payments and read-only savings activity. CSS contract checks
cover 340/390/412/454px views and preserve desktop cards at 1024/1366/1920px.

These use synthetic records and mocked provider boundaries. JSDOM has no layout
engine. Existing database tests use PGlite, not a live deployment. They do not
establish physical-phone, installed-PWA, real offline or live persistence results.

## Changes mapped to the review

| Review | Implemented response |
| --- | --- |
| UX-01 | In-memory discard protection, beforeunload guard and guarded subtype/back navigation. No plaintext financial drafts are stored locally. |
| UX-02 | Numeric search accepts displayed thousands separators, decimals and the selected currency prefix without treating arbitrary text as a number. |
| UX-03 | Selected-month budget labels, inputs and Save identify the actual month. |
| UX-04/05 | Mobile icon hit areas increased to 44px; navigation/supporting labels and budget/search inputs enlarged. |
| UX-06 | Mobile report/breakdown toggle keeps core summaries available without changing saved dashboard settings or desktop cards. |
| UX-07 | Constrained-height sheet spacing is compacted; keyboard-focused short views hide bottom navigation. Physical keyboard verification is pending. |
| UX-08 | Edit uses Income/Expenses groups, Purchase or bill, Pay credit card and Card interest or fees. Account selection remains separate. |
| UX-09 | Menu marks the current secondary destination. A redesigned bottom navigation is not included. |
| UX-10 | Card-detail payment action preselects its card and retains the existing financial save path; credit-capacity explanation breaks out reserved installments. |
| UX-11 | Savings history derives changes from existing balance projections; it does not create duplicate financial rows. |
| UX-12 | Payment-due / due-within-20-days filters and payment-priority sorting; purpose notes in repayment loan choices. |
| UX-13/14 | Dismiss reminder wording explains device-local behavior and lack of payment recording before the list; amount interpretation is also above the list. |
| UX-15 | Offline guidance and client-side offline form guards. A persistent last-synced dashboard and queued offline writes are not included. |
| UX-16 | App Back handling closes the top sheet, then details, then previously visited tabs; dirty drafts can cancel exit. Native-device verification is pending. |
| UX-17 | Ledger manifest naming and optional iPhone/Android installation instructions. |
| UX-18 | Explicit updates honor draft/write guards; another-tab worker activation defers reload while a draft/write is active. |

Additional fixes from the resumed safety tests: refreshed fixed-plan props no
longer replace a dirty monthly budget, Copy-from-fixed asks before replacing
edits, pending bank saves cannot be closed/refreshed, and mobile compact-mode
classes do not dissolve desktop card containers.

The eight larger feature proposals in the review are not a claim of completed
implementation: favorites, goals, report export, calendar, push delivery and
encrypted offline queues require separate product and verification work.

## Live test gate - pending

- Confirm final GitHub CI and Vercel preview build on the exact head.
- Sign in to that preview through authorized access to the isolated development
  backend. Do not test these changes on an older preview or production.
- Check entry draft dismissal, normal and formatted Ledger search, historical
  budget context, card payment preselection, savings drill-down, lending filters,
  reminder wording and restored settings in the live browser.
- Inspect normal desktop and narrow/short layouts in light/dark, including
  scrolling, fixed navigation, keyboard focus and Save reachability.
- Verify real browser Back and nested layers; synthetic popstate tests alone
  are not equivalent to operating-system Back.
- Physical iPhone 15 / Samsung S24 Ultra installed-PWA, native keyboard,
  installation, offline/reconnect, update and concurrent-device scenarios are
  not verified by this workspace. Keep that coverage limit explicit.

Do not claim universal zero bugs or full device certification. The user requires
successful tests before a dev merge; no merge has been performed for this work.

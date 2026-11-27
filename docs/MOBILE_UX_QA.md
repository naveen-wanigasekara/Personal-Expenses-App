# Mobile UX fixes - 27 November 2026

Development integration only. Base: dev b018f5543439e922e15dab75c3db4fc2887501f1.
No production, schema or authentication-policy changes. Existing financial records were not edited; a labeled disposable development entry was created, edited, reloaded and removed during QA, restoring the original balance.

## Automated evidence

The current local build and complete suite pass: 135 Node tests and 121 React
tests (256 total), with zero failures, cancellations or skipped tests. The full
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

## Live browser evidence

The signed-in immutable preview at application commit 7d9a319 was exercised in
Chrome. Passed: comma/currency-prefixed amount search; Close and real browser
Back cancellation retaining a draft; return to the previous tab; savings
activity and Back; card payment preselection; October budget labels and guarded
navigation; loan payment-due filtering and priority sorting; leading reminder
explanations and Dismiss wording. A labeled 1.25 QA expense was saved, edited to
1.50, verified after reload, deleted and verified absent after another reload.
The original cash balance was restored. No existing financial record was edited.

At 454 x 312 effective CSS pixels, header controls measured 44 x 44, report
expansion worked and the independent entry footer remained reachable. At
340 x 234, the entry sheet had no horizontal overflow and Save remained within
the viewport; budget input text measured 16px and the current Budget menu item
was marked. Light-mode installation guidance displayed without horizontal
page overflow; Dark and November were restored.

Live QA found that the short-height keyboard selector also matched theme radio
buttons, hiding navigation after theme selection. The selector now only matches
text-entry controls; a new regression test verifies radio focus retains nav and
text focus hides it. The final immutable preview at f8eeab9 passed the live
regression check at 454 x 312: Light and Dark radio focus left navigation
visible (display: flex), Insights remained directly reachable, and no horizontal
overflow occurred. Dark mode and 100% browser zoom were restored. No application-
origin console errors were captured; recorded errors came from the browser
extension. GitHub Security checks run 45944184246 and the Vercel preview build
both passed on that exact application head.

## Remaining physical-device test gate

All available automated checks and the browser scenarios above passed. Browser
zoom produced narrow, short CSS viewports; it is not mobile device emulation
and does not establish physical-device or installed-PWA behavior.

On both iPhone 15 and Samsung S24 Ultra, against the isolated development
preview, the remaining scenarios are:

- Install and launch the PWA; verify naming, icons, standalone launch and safe
  areas in portrait and landscape.
- Open entry and budget forms with the native keyboard. Reach each field and
  Save by scrolling; confirm focused fields, validation and dismissal do not
  leave controls obscured.
- Exercise native Back and nested sheet/detail navigation, cancelling draft
  discard and then accepting it. Confirm no accidental exit or duplicate saves.
- Disconnect and reconnect during reading and editing. Confirm the offline
  message, retained draft and blocked save; retry after reconnect and verify
  exactly one persisted record. Remove only the disposable QA record.
- Exercise an app update with a clean screen, dirty draft and pending save,
  including activation from another tab/device. Confirm no draft loss or
  duplicated write and that the update eventually applies after work finishes.
- Make independent disposable edits from both devices; refresh and confirm
  persisted results, understandable conflict/error behavior and no stale totals.

These scenarios cannot be certified by the current workspace, which has no
physical-phone session. No device results have been assumed or marked passed.
Do not claim universal zero bugs or full device certification. The user requires
successful tests before a dev merge; PR #29 remains draft and unmerged until
this outstanding verification is completed. Production is unchanged.

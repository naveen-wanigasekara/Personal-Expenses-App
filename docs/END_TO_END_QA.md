# End-to-end application review — 29 October 2026

Branch: `design/premium-fintech-refresh`. Preview only; no merge or production release. The shared Supabase database received one additive `investment_valuations.note text` column for the note field already present in the UI; existing records, RLS, and grants were preserved.

## Method and evidence

Used the signed-in test account, real preview UI, and synthetic labeled QA records. The desktop browser is 1363 × 936. A temporary same-origin review entry exercised actual CSS breakpoints at 1363 × 800, 768 × 900, 412 × 760, 390 × 740, and 320 × 640, plus constrained 412 × 420 and 320 × 350 viewports. These frames do not emulate touch, native keyboards, browser safe areas, or installed-PWA behavior. Review entries are removed from the final build.

Eight main screens were navigated at five sizes in both Light and Dark (80 screen/theme/viewport combinations). Root `scrollWidth` did not exceed `clientWidth`. Populated bank accounts were separately checked at all five sizes after cloud loading completed. Screenshots were inspected internally; no personal financial screenshots are published in this repository.

The local test suite has 35 passing tests. The build and whitespace checks pass. Test coverage includes monetary input, category fallback, fixed deposits, installment/date boundaries, loan amortization/totals, appearance/first paint, bank persistence/copy/error handling, and service-worker update activation. Database ownership checks ran under the authenticated role and were rolled back.

## User workflows exercised

| Area | Evidence and result |
| --- | --- |
| Navigation | Desktop rail, mobile drawer, bottom navigation, account/profile, previous/next month, and all eight main screens work. |
| Ledger | Created synthetic income, cash expense, card purchase, card payment, and card interest. Edited amount/note, searched no-match/cleared search, filtered card transactions, expanded rows, deleted and immediately undid deletion. Records survive reload. |
| Credit cards | Created and renamed a synthetic card; checked opening balance, debt, utilization, available credit, detail/master layouts, and activity. Canceled deletion confirmation without deleting. |
| Installments | Created a three-month plan, verified current/future commitments and notification completion. Boundary editing and validation retests are recorded below. |
| Budgets | Saved fixed total/category amounts, monthly expense and income overrides, checked a new month inherits a newly saved fixed plan. A controlled failure adapter renders the actual BudgetView and verifies an error with retained input, no false Saved state. Restored QA budget totals/categories to zero and display currency to LKR. |
| Investments | Created and edited a fixed deposit, updated a stock valuation, checked gain/history, note display, and edit/reload persistence. Jan 31 + one month displays Feb 28 and interest 10 for synthetic principal 1000 at 12%; five months with quarterly payments displays total interest 50. Canceled investment deletion. |
| Loan calculator | Principal 100000, 12%, one year displays installment 8884.88 and interest 6618.55. Zero interest over 12 months displays 8333.33 and zero interest. Fractional months are rejected. No financial records are created. |
| Bank Details | Saved and edited synthetic bank details, preserved leading zeros, copied the exact four-field block, and verified cloud reload. At 320 × 350, Save is within y=282–334, fields scroll independently, Shift+Tab wraps to Save, and Escape returns focus to Edit. Canceled deletion. |
| Reminders | Created a labeled monthly reminder; day 29 and fractional day 1.5 are rejected. Checked notification display and safe cancellation of deletion. |
| Categories | Created and renamed a category; protected category delete is disabled. Checked nested dialog focus restoration and canceled deletion of the QA category. Unknown historical IDs now stay in a catch-all rather than moving to a custom category. |
| Dashboard/charts | Checked totals, charts, plan comparison, section hide/show, ordering, and live previews of Bar/Line/Donut/Progress. Saved and renamed a custom chart; checked selection state and canceled deletion. |
| Appearance | Light/Dark/System selection, reload persistence, and cross-tab theme propagation. Restored Light, the test session's prior device preference. |
| Help and account | All 79 answers in 15 sections open with nonempty content; expanded state is exposed to assistive technology. Checked currency change/restoration, support destination without sending a message, and corrected privacy/display-currency descriptions. |
| App updates | Explicit refresh now checks for and activates updates. The normal branch address was verified loading current assets and navigation after previously serving an old cached shell. |

## Fixed findings

| Finding | Change and verification |
| --- | --- |
| Valuation notes disappeared after saving | Persist/decrypt notes, retain on edit, display in history; live save/reopen/reload verified. |
| Month-end FD maturity overflowed into March | Clamp calendar anniversaries; live Jan 31 → Feb 28 and leap-year/rollover regression tests. |
| Partial FD payout periods lost interest | Prorate the remaining period at maturity; live five-month quarterly example and regression tests. |
| At-maturity next payout showed zero | Use a dedicated next-payout amount; calculation regression test covers this path. |
| Orphaned transactions were attributed to the last custom category | Resolve a stable catch-all independently of list order; live breakdown and regression tests. |
| New-entry defaults could point to a missing category | Choose an existing account category; live selected-category check. |
| Amounts could display rounded cents but save extra decimals | Reject extra monetary precision/non-finite drafts, retain visible zero; live and unit checks. |
| Fractional reminder days were accepted | Require an integer within 1–28; live rejection verified. |
| Budget failures could announce Saved and alter global totals | Commit state after successful writes; saving/error state and failure-adapter retest. |
| Unsaved default months did not follow newly saved fixed plans | Include fixed-plan changes in inheritance synchronization; live new-month check. |
| Refresh could reopen the cached app shell | Check/activate updates before reload and check on visibility/focus; unit tests and normal-address current-build observation. |
| Full-height Loan/Bank screens flashed an outer scrollbar | Remove translated entry animation and redundant page padding; final viewport matrix shows full widths. |
| Misleading wording and incomplete help | Cash Balance Trend, Card transactions, spent/no-budget labeling, display-only currency and accurate privacy text; 79-answer live help pass. |
| Missing accessible state/labels | Reminder delete label, help expanded state, chart chip selection state, installment field/picker labels. |
| Installment upper limit/future elapsed calculation | Enforce limits and clamp billed months at zero; live 121-month rejection verified; future elapsed boundary is regression-tested. |
| Cleared or impossible dates could be recorded | Validate real calendar dates and installment start months; live cleared-date Record rejection and calendar-boundary regression tests. |

| Descriptive installment edits were not written to unchanged future rows | Update every affected row when only metadata changes; renamed November entry verified after reload, with billed amounts preserved. |
| Desktop month picker disagreed with the header outside the recent-year range | Include the selected month in its choices; final preview retest records the November selection. |

## Data retained

Existing QA transaction/card/investment/history remain. Added only labeled synthetic QA income/cash/card entries, a three-month installment plan with scheduled entries, a second card, fixed deposit, valuation entry/note, bank-details record, recurring reminder, custom category, and custom chart. No actual bank details were entered or sent. Budget values were restored to zero; display currency was restored to LKR. Permanent deletions were not performed.

## Boundaries and remaining coverage

This is a comprehensive browser review, not a proof that every possible input, failure, device, or concurrent action is correct. Permanent deletion completion, installment cancellation completion, account creation/email verification, password-reset email delivery, physical Android/iOS keyboards, Play Protect/PWA installation, native safe areas, real offline transitions, and instant cross-device data synchronization are not claimed as verified. Failure behavior is covered by the targeted budget UI fixture, adapter tests, and authenticated database isolation checks rather than a full live-network fault-injection suite.

The Supabase advisor reports an existing Auth warning: leaked-password protection is disabled. Auth policy was not changed. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Fresh sign-out/sign-in coverage and final build smoke checks are recorded after execution.

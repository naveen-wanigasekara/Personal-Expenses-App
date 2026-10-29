# Premium fintech UI review

Reviewed on 29 October 2026, on `design/premium-fintech-refresh`.

## Scope and method

Signed into the provided test account on the Vercel branch preview. Checked the live desktop browser at 1363 × 936 and the app in same-origin review frames at 1280 × 800, 768 × 1024, 430 × 932, 390 × 844, and 320 × 740. Review frames exercise actual CSS viewport breakpoints; they do not emulate touch hardware, a mobile keyboard, browser safe-area insets, or installed-PWA behavior. The temporary public review frame is removed from the final branch.

## Changes

- Kept mobile Ledger/Cards/Investments topbars inset at 320px after removing the duplicate view gutters.
- Removed redundant mobile page-bottom padding that made keyboard focus scroll the fixed header out of view.
- Removed duplicate outer gutters and top padding from mobile fixed-frame views; their inner scroll panes already provide gutters.
- Stacked budget category labels and inputs on narrow phones so full category names remain readable. At 320px, the previous layout reduced labels to about 16px; the new layout fits the longest default category name without clipping or horizontal page overflow.
- Replaced the bright mint investment background with a deep green gradient to restore text contrast. Applied the same surface to investment form previews.
- Added accessible field names to authentication, transaction, budget, card, investment, valuation, reminder, and chart controls. Added names to icon-only detail actions and selected-state information to category/color pickers.
- Stabilized shared Sheet registration across callback rerenders, restricted keyboard trapping to the topmost dialog, preserved pre-existing body scroll locks, and restored focus to the parent opener when closing an autofocus child dialog.

## Live verification

- Sign-in and session persistence across preview reloads.
- Primary desktop navigation and mobile bottom navigation/drawer.
- Dashboard empty and populated states, charts, Customize sheet, and live custom-chart preview. Custom-chart preview was canceled without saving.
- Ledger: create and edit a long-note, large-amount test entry; search with no matches; clear search; expand row; delete and undo. The amount remained readable at 320px.
- Budgets: fixed/month modes, labeled category amounts, save, and restore test budget amounts to zero. Verified no horizontal overflow at 320px.
- Cards: empty state, form validation, test-card creation, populated balance/utilization, mobile detail and desktop master/detail. Inspected installment controls and confirmed card-payment balance suggestion. No payment or installment plan was saved.
- Investments: empty state, standard and fixed-deposit conditional forms, test investment creation, record value, gains/return summary, value history and chart, desktop and tablet detail layouts.
- Profile/account, category management, help accordion, recurring reminder form/cancel, notification empty state.
- Nested dialog: Shift+Tab wraps within the child; Escape closes only the child and returns focus to Add category; parent scroll lock remains until its dismissal.
- `npm run build` and `git diff --check` pass. Build retains the existing large-bundle warning.

## Test data retained for future development

Only clearly labeled QA data was added: the UI QA long-note transaction, UI QA Card, and UI QA Investment with its initial and updated valuation. The budget values were restored to zero. The user requested that these clearly labeled QA records remain available for future development and testing. No existing user records were deleted. No merge or production deployment was performed.

## Limits

This is an interactive UI review, not an exhaustive automated regression suite. Native device behavior, installed PWA/offline/update flows, recovery emails, real payment flows, and destructive deletion were not executed. Confirm these separately before a production release.


## Appearance feature verification

Dark, Light, and System controls are available in mobile Profile and desktop Account. Preference is device-local; the existing dark default is preserved. Verified explicit Light survives reload and opening a second tab; changes propagate to the second tab. System selected the current OS appearance. Keyboard arrow keys switch the native radio controls. The mobile appearance options remain at least 63px tall and fit at 320px without horizontal overflow. Reviewed light dashboard charts, ledger, transaction sheet, budget inputs, and account/profile surfaces. Text/semantic color contrast against the light background is at least 5.28:1.

`npm test` passes five tests covering preference fallback, explicit/system resolution, first-paint/runtime agreement, blocked storage, and browser chrome updates. `npm run build` and `git diff --check` pass. The temporary appearance review page is removed from the final branch. No financial test data was added or removed for this feature; previously retained QA data remains available. Native installed-PWA/device appearance behavior was not separately exercised.


### Android automatic darkening follow-up

A user screenshot showed the intended Light palette rendered dark on a phone. Browser auto-darkening is suspected from the altered surface/accent colors, but the phone/browser state has not been directly inspected. Light now declares `only light` in both the pre-render/runtime color-scheme metadata and the root CSS, using Chrome's documented opt-out from automatic darkening. Dark and System resolution remain unchanged. Theme tests assert the opt-out at first paint, after switching, and when System resolves to Light. Native phone confirmation is still required.


## Loan calculator

Added Loan Calculator directly below Investments in the mobile drawer and desktop sidebar. It accepts principal, nominal annual interest percentage, and a term in years or months. The result is a monthly reducing-balance installment with payments at month end; fees and insurance are excluded. It uses the current display currency and theme, and creates no financial records.

Eleven tests pass, including six loan checks: reference installments, zero interest, amortization to zero, numerical stability, invalid inputs, and years/months conversion. The build and whitespace checks pass. Method reference: https://learn.microsoft.com/en-us/office/vba/api/Excel.WorksheetFunction.Pmt

Live desktop/mobile browser verification remains pending: the agent's temporary Vercel preview access expired. Automatic approval review rejected revoking/regenerating the temporary preview share link because it changes access control without explicit authorization. No protection settings were changed. Temporary review pages have been removed from the final branch. No merge or production deployment was performed.


## Bank Details feature

Added the Bank Details tab below Loan Calculator in both navigation menus. It provides four text fields (bank, branch, account holder, account number), multiple saved accounts, edit/delete, formatted copy, copy feedback, and manual-copy fallback. Account numbers preserve leading zeros. Cloud saves use the existing client-side encryption and an account-owned column with existing RLS; read/save failures remain visible and do not clear saved records.

Database activation completed on 2026-10-29: applied `add_bank_details_to_user_settings` to the connected expenses-app database, adding `public.user_settings.bank_details text`. Existing RLS and permissions were preserved. A transaction-scoped live check using the test account verified authenticated upsert/read and blocked cross-user reads/updates; the transaction was rolled back so no QA bank data or settings changes persisted. All 19 automated tests and the production build pass.

Automated tests cover formatting, leading zeros, required fields, encrypted persistence adapter behavior, per-user query scoping, edits/removal, failure/corruption handling, and clipboard success/denial. The adapter tests use a mocked database; the separate live database check above verifies RLS enforcement. End-to-end browser save/copy checks remain pending preview access. No actual bank details were used, copied, or sent during development.

The post-migration Supabase security advisor reported no table/RLS findings. Its existing Auth warning is leaked-password protection disabled; no Auth settings were changed.


### Bank details mobile Save visibility follow-up

The supplied phone recording shows the bottom navigation painting over the bank form while the keyboard is open. The form was nested in the view/content stacking context. The bank form now renders through a portal into a viewport-sized layer above navigation; its height and top follow VisualViewport resize/scroll events. Fields scroll independently, while the Save/error footer stays visible. Opening the form no longer automatically opens the keyboard. Viewport listeners are removed on unmount. This is scoped to Bank Details and preserves the existing save/store flow.

All 19 existing automated tests, the build, and whitespace checks pass. Browser layout verification could not run in this environment: no Chromium binary was installed, and browser download attempts returned invalid archives. Native keyboard/PWA behavior still needs a phone check; no claim of successful browser or native-device verification is made for this fix.


## Comprehensive follow-up review

See `docs/END_TO_END_QA.md` for the 29 October 2026 workflow matrix, findings, regression tests, retained synthetic data, and explicit verification limits. The temporary responsive/failure review entries are removed from the final build.

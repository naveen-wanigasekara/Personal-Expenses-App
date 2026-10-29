# Desktop UI refinement

Desktop presentation is isolated in `src/styles/desktop.css`, imported after the
existing styles. Every rule is inside a minimum-width query of 1024px, 1280px,
or 1600px. Existing stylesheets, component markup, financial calculations,
authentication and data access remain unchanged.

The dashboard uses an aligned grid instead of three narrow masonry columns.
Summary figures, chart panels, labels, page gutters, navigation and dialogs use
consistent sizing and spacing. Larger bar/line plots improve desktop readability;
card/investment details use a single scrolling detail pane. Budget, ledger,
calculator and bank-detail layouts share the desktop spacing system. Light and
dark themes continue to use the existing theme variables.

## Verification — 2026-10-29

The actual view components were rendered locally with synthetic records and
mocked bank storage. The temporary fixture and local preview configuration were
removed before publication; no demo route or authentication bypass is shipped.

- 56 desktop cases: seven screens at 1024, 1280, 1440 and 1920px in light and
  dark mode. Viewport/element-bound checks found no horizontal overflow.
- 42 phone/tablet comparisons: the same seven screens at 390, 768 and 1023px,
  in both themes. Original and updated renders matched element geometry and
  fingerprints of 31 computed layout/typography/color/border properties.
- Four mobile dialog comparisons: entry and card forms at 390 and 1023px matched
  after normalizing focus state; the card preview's random color was fixed in
  the temporary fixture so both renders used identical input data.
- Desktop screenshots and interactions reviewed dashboard, budget, card details
  and entry forms; all five entry-type controls had consistent 36px height and
  the Record action remained reachable. Dialog and master/detail scroll fixes
  were retested after adjustment.
- CSSOM validation confirms all three top-level rules are desktop-only media
  queries. No original mobile stylesheet was modified.
- Production build and all 80 automated regression tests passed after removing
  the temporary fixture and restoring the original development configuration.

This verifies presentation with synthetic fixtures. It does not replace real
account/data-flow security tests. Production release still requires the owner's
separate approval.

## Customize dialog follow-up

The owner's desktop screenshot exposed a stacking-context issue missed by the
synthetic entry-dialog check: Customize is nested inside `main.content`, unlike
the app-level entry dialog. Its backdrop was trapped below the sticky header.
At desktop widths only, content now rises above header/sidebar while it contains
an open backdrop, then returns to its normal layer on close. Two focused tests
cover the ancestor stacking contract at 1024/1366/1920px and unchanged mobile/
tablet stacking at 390/768/1023px. Browser visual retesting remains limited by
the previously reported workspace-credit approval failure.

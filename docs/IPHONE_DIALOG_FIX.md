# iPhone PWA dialog correction

The supplied iPhone 15 screenshots show horizontally clipped entry/investment
sheets and mobile navigation painted above Account security.

Shared Sheet now portals to document.body, escaping animated views and their
stacking contexts. Mobile sheets can shrink to the viewport; category tracks
use minmax(0, 1fr), long category labels wrap, and date controls fit their field.
The visible viewport bounds ordinary sheets when the software keyboard opens.
Pinch zoom is not treated as a keyboard resize. Existing nested focus/Escape
handling remains in place. The bank form opts out of the new portal because
it already owns a body portal, visible-viewport tracking and a fixed footer.

No financial logic, security rules, encryption configuration, database schema,
records, or production deployment is changed by this patch.

Validation: build; 77 Node tests + 15 React tests (92 total); strict dependency
audit with zero reported vulnerabilities; diff whitespace check. New tests
exercise actual portal placement, backdrop close events, viewport resize and
listener cleanup, nested focus trapping/Escape/restoration and the bank opt-out.
Desktop styling and breakpoints are retained.

Limit: the cloud browser cannot reach this workspace's local preview server.
An installed iPhone PWA/WebKit and its physical keyboard/safe-area rendering
have not been verified here. The owner should retest entry editing, new
investment, and Account security after loading the new dev release. Prior
workers wait for the app Refresh action before activating an update.

# Local build-only security patch

Based on MIT-licensed deepmerge 4.3.1 dist/cjs.js. Original SHA-256:
`2e5160f84a1141bd927264afe4d15766f1e6cf07daef182b37ff53fea121de7d`. This is a local fork, not an upstream release.

GHSA-gcqx-w48m-w2h4 has no upstream patched version at review time. The patch
rejects __proto__, constructor and prototype keys before writing either the
source or target into the result. Both inputs require protection. All remaining
merge logic is unchanged. The package is pinned by a local npm override; it does
not enter the browser bundle or financial-data code. Regression tests reproduce
unsafe null-prototype/own-property inputs and check normal configuration merges.

Do not replace this with a downgraded vulnerable dependency or suppress the audit.
Review upstream releases and remove the fork when an upstream fix is available.

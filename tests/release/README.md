# UI-only release baseline checks

These checks belong to `release/desktop-ui-only`, based on live main 59c0689.
They are retained as release evidence. They are intentionally outside the dev
`tests/*.test.js` glob: the combined dev app adds authentication/encryption and
features, so asserting byte equality to the older production app would be false.
The dev suite covers the security, financial, UI, theme, form and worker contracts.

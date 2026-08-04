## 1. JSON-only chooser-first import

- [x] 1.1 Move the JSON file input into the header flow so Import opens the native chooser first, passes the selected File into the dialog, handles cancellation, and supports same-file reselection.
- [x] 1.2 Remove CSV import parsing, document variants, flat Team mapping, UI branches, fixtures, messages, and tests while preserving strict state and generic nested JSON import.
- [x] 1.3 Add unit and browser coverage for chooser timing, JSON state and generic mapping, invalid JSON, size errors, cancellation, atomicity, and local-only processing.

## 2. Product terminology and wordmark

- [x] 2.1 Rename the header actions to Import and Export, the state dialog to Export workspace, and only the final data surface to localized Download terminology with consistent surface-specific copy.
- [x] 2.2 Replace the gradient word spans with one accessible foreground-colored monochrome Org Tools wordmark and update light/dark assertions.
- [x] 2.3 Update both message catalogs with exact key parity and retain Save and Org Editor Export terminology outside the renamed workflows.

## 3. Documentation and verification

- [x] 3.1 Update README, architecture, privacy, performance, usage, import-format, screenshot, OpenSpec-context, and publication documentation for JSON-only import and the new names.
- [x] 3.2 Run format, lint, typecheck, unit tests, build, browser smoke, deterministic screenshot generation and visual inspection, strict OpenSpec validation, and public-safety checks.
- [x] 3.3 Synchronize the capability specifications and archive the completed change.

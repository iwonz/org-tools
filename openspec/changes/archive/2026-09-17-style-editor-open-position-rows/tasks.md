## 1. Vacancy presentation

- [x] 1.1 Add the pointer-transparent one-pixel dashed outline layer to open-position rows with neutral, selected, and Employee-drop colors while preserving existing geometry and avatar styling.
- [x] 1.2 Add browser assertions for open-position versus Employee presentation, hover/focus/selection contrast, and geometry stability in both runtimes.

## 2. PNG parity

- [x] 2.1 Add a pure open-position outline presentation helper and paint the inset dashed outline from complete shared row bounds in full-View and scoped PNG.
- [x] 2.2 Add unit and browser coverage for default and Tag-expanded bounds, deterministic stroke settings, canvas state isolation, and preview/Copy/Save behavior.

## 3. Documentation and visual evidence

- [x] 3.1 Update usage and screenshot documentation for the distinct vacancy outline without changing locale catalogs or persistent contracts.
- [x] 3.2 Regenerate the existing 59-frame gallery twice, inspect every PNG, and compare deterministic SHA-256 manifests.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit tests, dev check, server build, Server/Pages browser tests, Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 4.2 Synchronize and archive the OpenSpec change, validate no active changes, integrate updated origin/main, merge and push main, delete the change branch, and verify clean matching HEAD/main/origin/main.

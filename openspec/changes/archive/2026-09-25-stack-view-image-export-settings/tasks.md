## 1. Full-View image dialog

- [x] 1.1 Stack the full-View preview and settings vertically with the established scoped-export dimensions and spacing.
- [x] 1.2 Remove the explanatory subtitle and its obsolete key from all six locale catalogs.
- [x] 1.3 Add browser coverage for the vertical ordering and absent subtitle while preserving existing preview, settings, Copy, and Save checks.

## 2. Documentation and gallery

- [x] 2.1 Update usage, architecture, screenshot documentation, and OpenSpec task status for the current dialog composition.
- [x] 2.2 Regenerate the maintained 59-frame gallery without changing its manifest and visually verify the affected image-export frames.

## 3. Validation and delivery

- [x] 3.1 Run formatting, lint, typecheck, unit tests, development probe, production build, and both-runtime browser tests.
- [x] 3.2 Generate the gallery twice, compare deterministic hashes, inspect every PNG, and run Pages build/check, public-safety scan, strict OpenSpec validation, and `git diff --check`.
- [x] 3.3 Synchronize capability deltas, archive the change, commit meaningfully, integrate fresh `origin/main`, merge and push `main`, delete the completed branch, and verify a clean synchronized repository with no active OpenSpec changes.

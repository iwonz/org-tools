## 1. Current export contract

- [x] 1.1 Replace the strict Download UI type, parser, defaults, and MobX state with JSON/Template settings, collection naming, exclusions, and group invariants.
- [x] 1.2 Replace the formatter with employee-first structured JSON and shared Template projection; remove CSV, separator configuration, and Papa Parse.
- [x] 1.3 Add unit tests for exact JSON shape, naming validation, group toggles, exclusions, Template rows, strict-state rejection, and large bounded previews.

## 2. Product interfaces

- [x] 2.1 Rebuild Data Download settings with JSON/Template tabs, tri-state Unit/Tag groups, virtualized exclusion selectors, and bounded preview/build feedback.
- [x] 2.2 Extend Editor export with scoped JSON and the shared Template behavior while preserving PNG and independent session settings.
- [x] 2.3 Replace the global Export modal with direct complete-state download, retain both Import modes, and remove Employee Export code and tests.
- [x] 2.4 Update English/Russian catalogs and browser coverage for both runtimes, both locales, direct Export, structured output, Editor scope, and diagnostics.

## 3. Documentation and gallery

- [x] 3.1 Update README, architecture, privacy, performance, usage, import-format, screenshot guidance, and OpenSpec repository context.
- [x] 3.2 Replace the two CSV screenshots with JSON-exclusion and Editor-JSON scenarios, update direct Export, and maintain exactly 38 declared PNGs.

## 4. Data and validation

- [x] 4.1 Stop the local runtime and transactionally convert only the ignored SQLite `ui.download` projection, preserving organization data and validating the new row.
- [x] 4.2 Run format, lint, typecheck, unit, dev check, both builds and browser suites, Pages/public checks, strict OpenSpec validation, and diff check.
- [x] 4.3 Generate and inspect all 38 PNGs twice and confirm identical SHA-256 hashes.

## 5. Specifications and delivery

- [x] 5.1 Synchronize delta specs into canonical specs, archive the change, and confirm no active OpenSpec changes.
- [x] 5.2 Commit as `feat: refine structured data exports`, integrate and push `main`, delete the merged change branch, and verify clean synchronized history without manually publishing Pages.

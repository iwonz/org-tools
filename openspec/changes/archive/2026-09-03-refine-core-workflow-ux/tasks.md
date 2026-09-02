## 1. Database recovery

- [x] 1.1 Add repository-level close, backup-family move, exact-schema recreation, validation, and atomic filesystem rollback
- [x] 1.2 Add the protected exact-body `POST /api/state` create-new operation and stable error handling
- [x] 1.3 Add the startup Create new confirmation beside Retry for unavailable and corrupt databases
- [x] 1.4 Cover database, sidecar, cancellation, rollback, and request-boundary behavior with unit and browser tests

## 2. Template format input

- [x] 2.1 Build the shared caret-positioned `TemplateFormatInput` with localized token metadata
- [x] 2.2 Implement pointer insertion and Arrow, Enter, Escape, Tab, Backspace, whitespace, and caret restoration behavior
- [x] 2.3 Replace Data Download and Editor token-button catalogs while preserving `{token}` and conditional formatting
- [x] 2.4 Add unit and browser coverage for both export surfaces and large bounded previews

## 3. Download and Units workflow

- [x] 3.1 Add bounded leading/trailing placement to context header actions and trail only the Download Continue icon
- [x] 3.2 Recompose Download as stable equal desktop columns and equal-height narrow rows with aligned summary/search controls
- [x] 3.3 Keep Unit-name search visible for every nonempty hierarchy and retain indexed filtering
- [x] 3.4 Add responsive geometry, source-switching, search, and accessibility browser coverage

## 4. Employee Import

- [x] 4.1 Analyze all source rows once to collect paths and choose the first richest representative record
- [x] 4.2 Add a scrollable 128 KiB representative JSON preview and left-to-right source-to-fixed-target mapping layout
- [x] 4.3 Make Tags and Teams ordinary mappings, remove the Team switch, and gate/reset Teams-only duplicate policies by mapping
- [x] 4.4 Preserve atomic indexed Apply and virtualized duplicate review at 20,000 Employees with focused tests

## 5. Calendar day details

- [x] 5.1 Flatten Birthdays and normalized per-Tag groups into one localized stable mixed row sequence
- [x] 5.2 Render one variable-size virtualizer with ordinary full Employee cards and interactive Tag-history headings
- [x] 5.3 Remove event subtitles, empty groups, nested scrolling, and two-column day-dialog geometry
- [x] 5.4 Add unit and browser coverage for ordering, repeated multi-Tag Employees, actions, themes, locales, and narrow screens

## 6. Employee form controls

- [x] 6.1 Replace Gender Select with a native-radio segmented control and birthday grid with one compound Select control
- [x] 6.2 Adapt the shared virtualized Tag picker to draft values and render every dated or undated chip in the wrapping trigger
- [x] 6.3 Apply generic Unit label, accessible name, and validation in every Employee form mode
- [x] 6.4 Add unit and browser coverage for create/edit draft behavior, keyboard semantics, birthday validity, Tags, and Unit assignment

## 7. Documentation and gallery

- [x] 7.1 Update README and architecture, privacy, performance, usage, import-format, and screenshot documentation
- [x] 7.2 Update the screenshot manifest to 40 scenarios with database recreation and Template token suggestions
- [x] 7.3 Regenerate and visually inspect all 40 PNGs, regenerate again, and compare deterministic SHA-256 hashes

## 8. Validation and delivery

- [x] 8.1 Run format, lint, typecheck, unit, dev check, server build, both browser suites, Pages build/check, public check, and diff check
- [x] 8.2 Synchronize capability deltas, archive the change, validate strictly, and confirm no active OpenSpec changes
- [x] 8.3 Commit as `feat: refine core workflow UX`, integrate into `main`, push GitHub, remove merged change branches, and verify a clean synchronized repository

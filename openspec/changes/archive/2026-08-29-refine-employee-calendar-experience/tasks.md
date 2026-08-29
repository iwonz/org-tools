## 1. Employee gender contract

- [x] 1.1 Add the required normalized Employee gender enum across shared types, runtime Employees, View-local records, normalization, strict state parsing, and synthetic fixtures.
- [x] 1.2 Preserve gender through ordinary import, structured import defaults, selectable Download fields, CSV/JSON output, and focused unit tests.
- [x] 1.3 Add the Employee form gender selector and exact-value Employee gender filters, including localized copy, derived search indexes, reset/count behavior, and unit/browser coverage.
- [x] 1.4 Restrict gender to Male, Female, and Not specified across the contract, selectors, import aliases, fixtures, tests, and documentation.

## 2. Employee and Editor interaction polish

- [x] 2.1 Make Editor command hover surfaces opaque and keep command geometry stable in both themes.
- [x] 2.2 Compact quick Employee tag rows to at most 44 px and verify their controls remain centered and actionable.
- [x] 2.3 Remove redundant Employee storage/avatar helper paragraphs and the visible Unit membership-mode label while preserving accessible control names.
- [x] 2.4 Replace the native tag-date input with a localized UI-kit calendar popover that omits the repeated tag label and retains date clearing.

## 3. Calendar consistency and actions

- [x] 3.1 Render every Calendar date as a consistently aligned interactive button with restrained hover/focus feedback, a stronger today treatment, and a locale-clean month plus numeric year heading.
- [x] 3.2 Remove the redundant Calendar day description and list padding, and reuse ordinary Employee tag/edit/delete row actions in the day dialog.
- [x] 3.3 Store the selected Calendar date key and re-derive the open day after Employee edits, tag changes, or deletion, with browser coverage for live updates.

## 4. Documentation and validation

- [x] 4.1 Update architecture, usage, import/export, performance, screenshot, and capability documentation for the implemented current-schema behavior.
- [x] 4.2 Update and run focused unit and browser tests for state, import/export, filters, forms, Editor hover, compact tags, and Calendar interaction.
- [x] 4.3 Run formatting, lint, typecheck, unit tests, production build, full browser smoke, strict OpenSpec validation, diff checks, and the public-safety scan.
- [x] 4.4 Regenerate all 16 gallery PNGs, visually inspect affected light/dark Editor, Employees, Calendar, and dialog states, and confirm deterministic gallery output.

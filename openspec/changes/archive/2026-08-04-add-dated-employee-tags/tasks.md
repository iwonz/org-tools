## 1. Tag model and version migrations

- [x] 1.1 Add the shared EmployeeTag model, ISO date validation, label projection, duplicate handling, and bulk update helpers with unit coverage
- [x] 1.2 Introduce OrgToolsStateV2 output and strict in-memory State V1 migration with compatibility and failure-atomicity tests
- [x] 1.3 Introduce OrgToolsImportV3 output and strict Import V2 migration, including dated-tag validation and candidate-state tests

## 2. Saving, importing, and exporting

- [x] 2.1 Update structured partial serializers, bundled interfaces, examples, and round-trip tests to Import V3 and full State V2
- [x] 2.2 Keep mapped CSV and ordinary JSON imports undated while preserving atomic identity matching
- [x] 2.3 Preserve label-only tags export and add JSON and text tagDates output with unit coverage

## 3. Tag editing and display

- [x] 3.1 Add optional date rows, clear controls, and localized validation to the Employee form
- [x] 3.2 Extend single and bulk quick-tag editors with preserve, mixed, set, clear, and remove date semantics
- [x] 3.3 Show compact localized dates and full-date tooltips on card and canvas tag chips while keeping search and Live filtering label-only

## 4. Calendar events

- [x] 4.1 Add derived birthday and dated-tag indexes with month/year navigation, leap-day handling, label grouping, and unit tests
- [x] 4.2 Render birthday and bounded tag events in day cells and add the localized combined day-detail dialog
- [x] 4.3 Add the two-line dated-tag cloud, overflow behavior, and virtualized upcoming/past event dialog
- [x] 4.4 Verify the expanded Calendar remains scroll-free at 1280 by 720 and safely scrollable on smaller viewports

## 5. Localization, documentation, and validation

- [x] 5.1 Add matching English and Russian messages, parameter parity tests, localized dates, plurals, errors, and accessibility text
- [x] 5.2 Update architecture, privacy, performance, usage, import-format, screenshot, and capability documentation
- [x] 5.3 Add EN/RU browser coverage for tag dates, bulk editing, migration saves, day details, cloud dialogs, and year-boundary navigation
- [x] 5.4 Update and manually inspect deterministic screenshots for Calendar, Employee form, tag popover, and dated-tag dialogs
- [x] 5.5 Run format, lint, typecheck, unit tests, build, browser smoke, strict OpenSpec validation, screenshot generation, and public:check

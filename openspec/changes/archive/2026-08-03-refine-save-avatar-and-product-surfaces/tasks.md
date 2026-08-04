## 1. Structured import version 2

- [x] 1.1 Replace the public V1 types and strict parser with the sole supported `OrgToolsImportV2` contract
- [x] 1.2 Validate and remap Live boss and position-override Employee keys into atomic Main candidates
- [x] 1.3 Update bundled interfaces/examples and parser/candidate tests for V2, removed V1, Live roles, and rollback

## 2. Structured save workflow

- [x] 2.1 Implement and unit-test deterministic Teams, Employees, and combined Main serializers
- [x] 2.2 Add the localized four-choice Save dialog, disabled empty choices, filenames, notices, and full-state path
- [x] 2.3 Add browser coverage for Save ordering, downloads, V2 contents, complete state, and re-import round trips

## 3. Local avatar crop workflow

- [x] 3.1 Add `react-easy-crop` and bounded local image decode, downscale, crop, WebP, and cleanup helpers
- [x] 3.2 Replace raw avatar text editing with preview, file, clipboard, paste, recrop, replace, and remove controls
- [x] 3.3 Add localized owned avatar failures and unit/browser coverage for valid, canceled, invalid, and cleared workflows

## 4. Product surface refinements

- [x] 4.1 Reorder import references and product tabs, move Export last, and apply the graphite-to-blue wordmark palette
- [x] 4.2 Move Calendar month navigation into the header and make the 31-day grid fit the maintained desktop viewport
- [x] 4.3 Flatten Analytics visual grouping while preserving sorting, virtualization, empty/loading states, and drill-down
- [x] 4.4 Add localized browser layout assertions and regenerate deterministic shell, Calendar, and Analytics screenshots

## 5. Documentation and validation

- [x] 5.1 Update architecture, privacy, performance, usage, import-format, and screenshot documentation
- [x] 5.2 Run format, lint, typecheck, unit tests, production build, and strict OpenSpec validation
- [x] 5.3 Run full browser smoke, screenshot generation and inspection, then `public:check`

## 1. Strict state and domain model

- [x] 1.1 Replace Employee digest IDs with UUID identity and normalized duplicate-key validation
- [x] 1.2 Add strict custom field definitions, typed Employee values, Tag catalog definitions, and reference validation
- [x] 1.3 Add template dependency parsing, cycle validation, key rewriting, MD5/SHA-256 evaluation, and derived indexes
- [x] 1.4 Replace birthday, Tag, custom filter, Download order, and Calendar UI state shapes without compatibility readers

## 2. Stores and Employee workflows

- [x] 2.1 Update stores and current Unit derivation for UUID Employees, catalog Tags, and cached custom values
- [x] 2.2 Add Employee model management with definition validation, destructive type changes, and dependency-safe deletion
- [x] 2.3 Add Tag management with search, counts, palette colors, rename, reset, and confirmed cascading deletion
- [x] 2.4 Add typed Value controls and required-field validation to Employee create/edit and update every Tag picker
- [x] 2.5 Reorder sidebar and register the three responsive Employees header actions

## 3. Filters and Import

- [x] 3.1 Reorder all shared filters and add complete birthday year plus virtualized custom-field multiselects
- [x] 3.2 Extend Live Unit rules and every persisted filter consumer with gender, complete birthday, and custom criteria
- [x] 3.3 Require Employee Import UUID mapping and implement independent identity/UUID conflict validation
- [x] 3.4 Add cached three-column virtualized Import review with bulk and per-row Add, Update, Teams-only, and Skip policies
- [x] 3.5 Map existing Value fields and atomically create configured Value definitions while importing neutral catalog Tags

## 4. Structured output

- [x] 4.1 Add custom fields to shared token suggestions and dependency-ordered Template rendering
- [x] 4.2 Add sortable, nameable custom fields with typed values to Data Download JSON
- [x] 4.3 Add identical custom JSON and Template behavior to Editor export

## 5. Calendar

- [x] 5.1 Build locale-aware weekday headings, leading offsets, actual weekend metadata, and weekend tones
- [x] 5.2 Replace inline day Tag labels with one icon and assignment count while retaining birthdays and day details
- [x] 5.3 Move dated Tags into the horizontal header rail, remove redundant title/count, and add conditional Today navigation

## 6. Current database and documentation

- [x] 6.1 Back up and transactionally rewrite the stopped local SQLite state, then verify counts, references, timestamps, and revision
- [x] 6.2 Update AGENTS, README, architecture, usage, privacy, performance, import formats, and screenshot documentation
- [x] 6.3 Update synthetic fixtures and the screenshot manifest to exactly 46 current scenarios

## 7. Tests and verification

- [x] 7.1 Add unit coverage for UUID identity, strict state, fields, hashes, cycles, Tags, filters, Import, export, and Calendar
- [x] 7.2 Add server and Pages browser coverage in both locales, themes, and maintained responsive widths without diagnostics
- [x] 7.3 Verify the 20,000 Employee and 4,000 Unit performance target and bounded Import/filter/output behavior
- [x] 7.4 Run format, lint, typecheck, unit, dev check, both builds, browser suites, Pages/public checks, strict OpenSpec validation, and diff check
- [x] 7.5 Regenerate and visually inspect all 46 PNG files twice and confirm deterministic SHA-256 hashes

## 8. Specification and delivery

- [x] 8.1 Synchronize delta specs into canonical specs, archive the completed change, and validate no active changes remain
- [x] 8.2 Commit, integrate the change branch into current origin/main, push main, remove the merged branch, and verify a clean synchronized worktree

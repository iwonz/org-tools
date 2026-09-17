## 1. State and View operations

- [x] 1.1 Add required nullable `backgroundColor` to open-position types, creation/edit inputs,
  strict exact-key parsing, current fixtures, and State validation tests while rejecting the
  immediately previous shape.
- [x] 1.2 Preserve open-position backgrounds through history, View cloning, Unit copy/paste,
  SQLite/BroadcastChannel state, Tag cleanup, and replacement/deletion behavior with focused store
  and View tests.

## 2. Editor and PNG presentation

- [x] 2.1 Add the existing local color picker with an explicit no-background option to the
  open-position create/edit dialog and render the persistent tonal surface without changing row
  geometry or transient selection/drop styling.
- [x] 2.2 Add a pure PNG background resolver and paint colored full-row bounds before the dashed
  outline in full-View and Unit/subtree exports, with unit coverage for null, named, custom, Tag-
  expanded, and Canvas state behavior.

## 3. Browser evidence and documentation

- [x] 3.1 Extend shared Server/Pages browser coverage for create, edit, clear, cancel, Undo/Redo,
  clone/paste, persistence, geometry, selection/drop priority, and PNG preview/Copy/Save parity.
- [x] 3.2 Update architecture, usage, privacy, performance, and screenshot documentation; reuse
  existing complete locale keys and keep all six catalogs valid.
- [x] 3.3 Update the existing synthetic open-position fixture and affected screenshots without
  increasing the 59-frame catalog, generate the gallery twice, visually inspect every PNG, and
  compare deterministic SHA-256 manifests.

## 4. Validation, database readiness, and delivery

- [x] 4.1 Run format, lint, typecheck, unit tests, dev check, server build, Server/Pages browser
  tests, Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 4.2 Inspect the configured owned SQLite snapshot; record absent/already-current or stop the
  runtime, retain a timestamped ignored database-family backup, convert the immediately previous
  shape offline, validate detached and committed State with the production parser, and prove normal
  startup.
- [x] 4.3 Synchronize and archive the OpenSpec change, validate no active changes, integrate updated
  origin/main, merge and push main, delete the change branch, and verify clean matching
  HEAD/main/origin/main.

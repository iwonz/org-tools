## 1. State and domain model

- [x] 1.1 Add open-position IDs, types, Unit storage, selection, anchor ownership, cloning, defaults, and exact parser/graph validation.
- [x] 1.2 Update every current State producer, fixture, View clone, Unit clipboard path, equality check, and Tag deletion path for required open positions and remapped references.
- [x] 1.3 Add unit tests for valid and invalid State, Live-Unit rejection, clone/copy remapping, Tag deletion, history, and Employee-oriented export exclusions.

## 2. Shared row geometry and store commands

- [x] 2.1 Generalize deterministic Employee row ordering, measured height caches, prefix offsets, bounds, and virtualization to discriminated Employee/open-position rows.
- [x] 2.2 Implement create, update, delete, picker replacement, drag replacement, selection, attachment rekey/detach, root realignment, and one-command Undo/Redo semantics.
- [x] 2.3 Extend anchor resolution, dependency owner keys, scoped canvas-element inclusion, collapse fallback, and incremental indexes for open positions.
- [x] 2.4 Add unit tests for ordering, grouping, geometry, virtualization, replacement variants, attachments, collapse, deletion, and command boundaries.

## 3. Editor interface and localization

- [x] 3.1 Add the create/edit open-position dialog with title validation and the shared dated Tag picker, limited to manual Units.
- [x] 3.2 Render accessible placeholder rows and implement selection, position context actions, single-select replacement, and single-Employee drop targeting without changing multi-drop behavior.
- [x] 3.3 Add all new and changed strings to the six locale catalogs and browser coverage for CRUD, Tags, Live exclusion, replacement, attachments, collapse, and Undo/Redo in Server and Pages.

## 4. PNG parity and product documentation

- [x] 4.1 Render open positions in full-View and Unit/subtree PNG with shared row/Tag geometry, placeholder avatars, scoped attachments, and Employee-only summaries/templates.
- [x] 4.2 Add painter/render-plan parity tests and browser checks for preview, Copy, Save, collapse, bounds, and attached annotations.
- [x] 4.3 Update architecture, usage, privacy, performance, screenshot documentation, and the existing synthetic Editor screenshot evidence.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, dev check, server build, Server/Pages browser tests, Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 5.2 Generate the gallery twice, inspect every PNG, and compare deterministic SHA-256 hashes without increasing the catalog.
- [x] 5.3 Inspect the configured owned SQLite snapshot; record absent/current status or perform the stopped-runtime backup, detached conversion, production-parser validation, atomic install, and startup proof.
- [x] 5.4 Synchronize and archive the OpenSpec change, validate no active changes, integrate updated origin/main, merge and push main, delete the change branch, and verify clean matching HEAD/main/origin/main.

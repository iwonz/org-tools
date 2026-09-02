## 1. Current data model

- [x] 1.1 Implement normalized full SHA-256 Employee IDs with strict validation, duplicate prevention, and known-answer tests.
- [x] 1.2 Atomically re-key every Employee reference when identity changes and cover conflicts and reference integrity.
- [x] 1.3 Replace View-based public state with one current Unit structure and one Editor UI projection; remove View stores, controls, translations, and Download source selection.
- [x] 1.4 Update strict parsing, blank state, fixtures, SQLite repository tests, and cross-tab state tests for the current-only contract.

## 2. Employee transfer

- [x] 2.1 Add validated flat Employee export with nested portable Team assignments and a State/Employees Export modal.
- [x] 2.2 Add bounded Employee JSON parsing, source-path discovery, field mapping, current nested tag/Team validation, and preview derivation.
- [x] 2.3 Add optional Team import, path matching/creation, deterministic duplicate detection, bulk policies, sparse per-row overrides, and one atomic store apply.
- [x] 2.4 Build the localized responsive State/Employees Import modal with mapping, counts, virtualized matched-Employee review, validation, cancellation, and retry.
- [x] 2.5 Cover 20,000-row linear derivation, virtualized review, local-only transfer, atomic rollback, and both runtime workflows in unit/browser tests.

## 3. Current data and product documentation

- [x] 3.1 Stop the local runtime and transactionally convert the owned SQLite state to hash IDs and one structure, preserving revision, timestamps, counts, assignments, and semantic content.
- [x] 3.2 Update README, architecture, privacy, performance, usage, transfer format, contributor guidance, and canonical screenshot descriptions.
- [x] 3.3 Replace obsolete View screenshots with State/Employees transfer, mapping, Team, and duplicate policy scenarios; regenerate and visually inspect the complete deterministic gallery twice.

## 4. Verification and delivery

- [x] 4.1 Run format, lint, typecheck, unit, dev check, both builds and browser suites, Pages/public checks, strict OpenSpec validation, and diff check.
- [x] 4.2 Synchronize canonical specs, archive the change, verify no active changes, and audit staged publication contents.
- [x] 4.3 Commit, fast-forward merge into `main`, push GitHub, delete the merged change branch, and verify clean synchronized refs without manually publishing Pages.

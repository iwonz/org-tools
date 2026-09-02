## 1. Unified JSON ordering

- [x] 1.1 Replace the durable Employee-only JSON order with one strict top-level scalar/Unit/Tag order and update parsing, fixtures, state capture, and serialization.
- [x] 1.2 Make structured JSON generation honor top-level and nested order with unit coverage for disabled collections, renaming, and reorder behavior.
- [x] 1.3 Render one sortable JSON field list with inline Unit/Tag rows and accessible drag handles in Data Download and Editor export.

## 2. Shared and simplified Editor controls

- [x] 2.1 Extract one shared Template multi-Unit row-mode control and use it in both export surfaces.
- [x] 2.2 Add thematic leading icons to Editor scope controls and icon-only accessible title alignment in the Title/Size row.
- [x] 2.3 Localize the default image boss label, exclude avatar data from image-format tokens, remove Open/expanded preview behavior, and remove redundant Editor Preview headings.

## 3. State, documentation, and visual coverage

- [x] 3.1 Transactionally rewrite only the stopped local SQLite Download projection to the current unified order and verify organization preservation plus production-parser acceptance.
- [x] 3.2 Update README, architecture, privacy, performance, usage, screenshot documentation, and both catalogs for the refined export workflow.
- [x] 3.3 Extend unit/browser coverage, regenerate all 38 screenshots twice, inspect every changed scenario, and verify deterministic SHA-256 hashes.

## 4. Verification and delivery

- [x] 4.1 Run format, lint, typecheck, unit, dev check, both production builds and browser suites, Pages/public checks, strict OpenSpec validation, and `git diff --check`.
- [x] 4.2 Synchronize canonical specs, archive the completed change, verify no active changes, and review the staged set for generated or private artifacts.
- [x] 4.3 Commit meaningfully, fast-forward into synchronized `main`, push GitHub, remove the merged branch, and verify clean matching `HEAD`, `main`, and `origin/main`.

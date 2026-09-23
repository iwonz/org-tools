## 1. Live Display settings

- [x] 1.1 Add focused no-op-aware store mutations for one Employee display format and one line gap, with unit coverage for revisions and unchanged writes.
- [x] 1.2 Remove duplicate `TemplateFormatInput` change emission and add the reusable label-side Reset action slot.
- [x] 1.3 Replace Display drafts, sliders, readouts, and Save action with live format updates, transient bounded number inputs, and locale-aware per-section Reset actions.
- [x] 1.4 Add Reset copy to all six locale catalogs and validate catalog parity.

## 2. Shared layout and navigation semantics

- [x] 2.1 Render mounted list-card information columns from the shared measured visual-row layout and apply line gaps strictly between rows.
- [x] 2.2 Add explicit Employee-card surface context and keep native `{positions}` Unit navigation only in Employees and Units cards.
- [x] 2.3 Remove implicit links from ordinary tokens while preserving explicit safe Markdown links and inert Editor/PNG styling.
- [x] 2.4 Cover one-row and multi-row gap geometry, wrapping, authored blank rows, ordinary-token text, explicit links, and native position navigation with unit tests.

## 3. Browser behavior and documentation

- [x] 3.1 Update browser tests for immediate saving, invalid numeric input normalization, close/reopen, server reload, live-tab synchronization, four independent resets, and unchanged gaps.
- [x] 3.2 Verify Employees/Units native Unit navigation, inert fallback/Editor/PNG surfaces, explicit Markdown links, and shared DOM/PNG geometry at gaps 0, 4, and 24.
- [x] 3.3 Update architecture, usage, performance, privacy, and screenshot documentation for live settings, shared row layout, and explicit navigation.
- [x] 3.4 Update the maintained 59-frame screenshot scenario to show numeric gaps, Reset actions, and no Display Save button.

## 4. Validation and delivery

- [x] 4.1 Run formatting, lint, typecheck, unit tests, development probe, production build, and browser tests for both runtimes.
- [x] 4.2 Generate the 59-image gallery twice, compare deterministic hashes, and visually inspect every PNG.
- [x] 4.3 Build and validate Pages, run the public-safety scan, strict OpenSpec validation, and `git diff --check`; record that the unchanged State shape requires no SQLite conversion.
- [x] 4.4 Synchronize and archive the OpenSpec change, integrate current `origin/main`, merge and push `main`, delete the completed branch, and verify a clean synchronized repository with no active changes.

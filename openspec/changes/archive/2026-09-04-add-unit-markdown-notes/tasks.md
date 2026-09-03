## 1. State and Editor domain

- [x] 1.1 Add the required bounded `noteMarkdown` Unit field to shared types, strict parsing,
  defaults, fixtures, cloning, equality, and complete State transfer.
- [x] 1.2 Add one validated View-local note Save command with timestamp, Undo/Redo, Copy/Paste, and
  View-clone coverage.
- [x] 1.3 Back up and convert the configured local SQLite state offline, verify only empty Unit notes
  and one revision were added, and leave no runtime migration code.

## 2. Safe note interface

- [x] 2.1 Add browser-safe lazy Markdown dependencies and an inert GFM preview that blocks raw HTML,
  image requests, opener, and referrer disclosure.
- [x] 2.2 Add the geometry-neutral Unit note action and Preview-first draft dialog with explicit Save,
  clear behavior, and unsaved-close confirmation.
- [x] 2.3 Add complete EN/ZH/RU/ES/FR/AR visible and accessibility copy with RTL coverage.

## 3. Product coverage

- [x] 3.1 Add unit and browser tests for validation, history, View isolation/copying, persistence,
  state transfer, safe rendering, interaction states, localization, and both runtimes.
- [x] 3.2 Update architecture, privacy, performance, usage, import-format, README, screenshot guide,
  and canonical frame-count references.
- [x] 3.3 Add deterministic Preview and Editor screenshot scenarios, regenerate all 54 PNGs twice,
  inspect every frame, and compare SHA-256 manifests.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit, development check, both production builds, both browser
  suites, Pages check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 4.2 Synchronize capability deltas, archive the change, validate no active changes, and commit as
  `feat: add Unit Markdown notes`.
- [x] 4.3 Fetch and integrate current origin, fast-forward merge into `main`, push, delete the merged
  change branch, and verify clean matching `HEAD`, `main`, and `origin/main` without publishing Pages.

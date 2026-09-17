## 1. Shared color model and rendering

- [x] 1.1 Add pure draft decode/encode and opacity helpers for named, custom, null, and existing
  eight-digit colors, including semantic 100 percent, canonical alpha bytes, and `40% → 66` tests.
- [x] 1.2 Preserve real non-opaque alpha plus readable light/dark foregrounds in shared DOM and
  Canvas color helpers without changing established opaque named/custom treatment.

## 2. Shared picker interaction

- [x] 2.1 Rebuild `TagColorPicker` as a local draft transaction with palette, exact modes,
  synchronized opacity slider/percentage input, Apply/Cancel, invalid-state blocking, dismissal,
  external reset, and focus restoration.
- [x] 2.2 Replace vertical preset rows with one wrapping accessible listbox of stable Tag-like chips,
  preserving optional No color and compact narrow/RTL behavior.
- [x] 2.3 Add `Opacity` to all six locale catalogs and update shared interaction/browser helpers for
  the explicit Apply workflow.

## 3. Editor and export parity

- [x] 3.1 Verify and cover actual alpha for Tag surfaces, Calendar, Unit footers, distribution rows,
  open positions, Text, Sticker, and Arrow while retaining selection/drop precedence.
- [x] 3.2 Verify full-View and Unit/subtree PNG use the same alpha source, compositing, readable text,
  and unchanged native Image-export color inputs.

## 4. Evidence and documentation

- [x] 4.1 Extend unit and shared Server/Pages browser tests for atomic Apply/Cancel, zero-through-
  hundred opacity, exact-mode synchronization, one write/history entry, Undo/Redo, keyboard, RTL,
  narrow layout, every picker consumer, and DOM/PNG parity.
- [x] 4.2 Update architecture, usage, privacy, and screenshot documentation plus the existing
  59-frame gallery without adding a scenario; generate twice, inspect every PNG, and compare hashes.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, dev check, server build, Server/Pages browser tests,
  Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 5.2 Synchronize and archive the OpenSpec change, verify no active changes, integrate current
  origin/main, merge and push main, delete the change branch, and prove clean matching
  HEAD/main/origin/main.

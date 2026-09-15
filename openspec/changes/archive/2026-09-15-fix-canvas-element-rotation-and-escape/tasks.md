## 1. Rotation geometry

- [x] 1.1 Add a pure single-rectangle rotation helper that preserves the current geometric center and compensates durable attachment offsets.
- [x] 1.2 Route single Text, Sticker, and Image rotation previews and commits through the helper while retaining the existing group and Arrow transform path.
- [x] 1.3 Add unit regressions for non-square, resized, already-rotated, and attached rectangular elements.

## 2. Escape selection

- [x] 2.1 Clear resting canvas-element selection on Escape without affecting editable controls, menus, active gestures, history, or document state.
- [x] 2.2 Add server and Pages browser coverage for selection-frame and contextual-property dismissal.

## 3. Documentation and validation

- [x] 3.1 Update architecture and usage guidance for exact single-element pivots and Escape selection behavior.
- [x] 3.2 Run format, lint, typecheck, unit, dev check, server build, server/Pages browser tests, both Pages checks, and public safety checks.
- [x] 3.3 Regenerate the 59-image gallery twice, inspect every PNG, compare deterministic hashes, validate OpenSpec strictly, and run `git diff --check`.
- [x] 3.4 Synchronize and archive the change, validate no active changes, commit, merge into updated `main`, push, delete the change branch, and verify a clean synchronized repository.

## 1. State and shared layout

- [x] 1.1 Add canonical Sticker format runs to shared types, constructors, cloning, copy/history, and exact State parsing with preceding-shape normalization.
- [x] 1.2 Replace the rich layout with word-aware automatic/fixed geometry, bounded uniform effective scaling, overflow height, vertical alignment, and shared fragment/fill output.
- [x] 1.3 Update Text single/group resize, rotation, attachments, and normalization for two-dimensional fixed frames without mutating authored sizes in a single-element resize.

## 2. Rich editing and controls

- [x] 2.1 Generalize the selection-aware contenteditable draft to Text and Sticker with selectionchange/outside-pointer tracking, toolbar range retention, caret styling, plain paste, IME, and idempotent commit.
- [x] 2.2 Replace Text and Arrow tool icons, replace marker Selects with accessible icon toggles, and remove Image geometry plus its empty property surface.

## 3. Arrow and PNG parity

- [x] 3.1 Implement normalized chord-frame Arrow endpoint and attachment projection with snapping and near-zero fallback while preserving freeform controls.
- [x] 3.2 Paint fitted Text, rich Sticker, and proportionally resolved Arrows through the shared PNG render plan and await every used range font.

## 4. Automated coverage

- [x] 4.1 Add unit coverage for Sticker State/runs, word wrapping, auto caps, scale floor, overflow, manual frames, transforms, attachments, normalized Arrows, and DOM/PNG geometry.
- [x] 4.2 Update server and Pages browser coverage for pointer range formatting, toolbar focus, caret/paste/Undo, Text fitting and resize, Sticker rich text, icons, marker toggles, Arrow shape, Image controls, and PNG parity.

## 5. Documentation and screenshots

- [x] 5.1 Update organization-editor documentation, architecture, usage, privacy, performance, and all six locale catalogs; remove obsolete marker-option messages.
- [x] 5.2 Update existing Editor/Image screenshot scenarios without adding a frame, generate twice, inspect every PNG, and compare deterministic hashes.

## 6. Validation and delivery

- [x] 6.1 Inspect and, if required, safely prepare the configured owned SQLite snapshot with backup, detached validation, fingerprints, atomic conversion, and production reopen evidence.
- [x] 6.2 Run format, lint, typecheck, unit, dev check, server build, browser tests, Pages build/check, public check, strict OpenSpec validation, and git diff check.
- [x] 6.3 Sync and archive the OpenSpec change, validate no active changes, integrate latest origin/main, merge and push main, remove the change branch, and verify clean synchronized refs.

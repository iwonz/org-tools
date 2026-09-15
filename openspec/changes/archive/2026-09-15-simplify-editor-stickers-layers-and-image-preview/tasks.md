## 1. Flat Sticker and stable text drafts

- [x] 1.1 Replace folded Sticker styling with shared flat fill/border primitives in DOM and PNG, and add focused unit coverage for named, HEX, and RGBA colors.
- [x] 1.2 Share wrapped text metrics and vertical placement across resting DOM, editing drafts, auto-fit, and PNG; grow overflow height transiently and commit text plus final geometry once.
- [x] 1.3 Add unit and browser coverage for all nine alignments, focus/blur stability, overflow growth, and single-command Undo/Redo.

## 2. Compact properties and global layer actions

- [x] 2.1 Rebuild the contextual property surface as one compact auto-width row with type-specific controls, a 3-by-3 alignment popover, a geometry popover, and a More menu.
- [x] 2.2 Remove Forward/Backward UI and implement global Back/Front transitions across the Unit plane while preserving selected relative order, attachments, offsets, targets, and dependents.
- [x] 2.3 Align the canvas-element context menu with Back, Front, Duplicate, and Delete only, including mixed/group applicability.
- [x] 2.4 Add store/unit and browser coverage for every element kind, grouped ordering, Unit/Employee overlap, attachment preservation, and one-command Undo/Redo.

## 3. Shared interactive PNG preview

- [x] 3.1 Add pure preview viewport geometry for Fit, 10%-to-400% bounds, pointer-centered zoom, constrained pan, normalized focal preservation, and resize/regeneration behavior.
- [x] 3.2 Build one accessible transient PNG preview component with wheel/buttons/100%/Fit zoom, pointer pan, keyboard pan, and responsive bounds.
- [x] 3.3 Adopt the shared viewport in full-View and Unit/subtree Image dialogs and remove visible final-size, effective-density, and clamping copy without changing render limits, Copy, or Save.
- [x] 3.4 Add unit and server/Pages browser coverage for preview navigation, regeneration preservation, hidden render-plan copy, and decodable Copy/Save PNG output.

## 4. Product contracts and visual fixtures

- [x] 4.1 Remove obsolete Forward/Backward and render-plan message keys, add any required accessible preview/property copy, and keep all six locale catalogs complete.
- [x] 4.2 Update architecture, usage, privacy, performance, and screenshot documentation for flat Stickers, global layers, compact properties, and local transient PNG preview navigation.
- [x] 4.3 Update the existing demo-editor, editor-image-export, and editor-image-settings frames without increasing the 59-frame gallery.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, dev check, server build, browser tests, Pages build/check, public check, strict OpenSpec validation, and git diff checks.
- [x] 5.2 Generate the 59-frame gallery twice, visually inspect every PNG, and compare deterministic SHA-256 hashes.
- [x] 5.3 Sync the organization-editor delta into canonical specs, archive the change, validate no active changes, commit, integrate current origin/main, merge and push main, delete the temporary branch, and verify a clean synchronized repository.

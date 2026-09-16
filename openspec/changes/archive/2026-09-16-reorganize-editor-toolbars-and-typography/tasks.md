## 1. Typography contract

- [x] 1.1 Add shared current and legacy canvas font metadata, local CSS/Canvas stack resolution, legacy family fallback, and element-weight normalization without changing the State shape.
- [x] 1.2 Default new Text, Sticker, and Editor Image settings to System; limit canvas and both Image export pickers to localized System and Georgia.
- [x] 1.3 Replace the weight Select with one accessible Bold toggle that writes only 400 or 700 and normalizes legacy typography on the first explicit edit.
- [x] 1.4 Add unit coverage for font stacks, legacy parser acceptance and presentation, weight normalization, defaults, layout measurement, and PNG parity.

## 2. Editor toolbar composition

- [x] 2.1 Extract shared Editor toolbar surface/button metrics and apply them to View, command, history/viewport, tool, and contextual-property surfaces.
- [x] 2.2 Move Export to the always-available top-end command surface, combine Undo/Redo with bottom-start viewport controls, and place tools with properties in a responsive bottom-centered dock.
- [x] 2.3 Remove the contextual More menu and its Back/Front/Duplicate/Delete callbacks while preserving the element context menu, shortcuts, and history behavior.
- [x] 2.4 Replace the Sticker and zoom-reset icons, retain reset-to-100-percent behavior, and keep accessible labels and pressed states complete.
- [x] 2.5 Add server and Pages browser coverage for placement, compact collision avoidance, RTL, unified metrics, empty-View export, context-menu ownership, Bold, fonts, legacy State, and zoom reset.

## 3. Product contracts and visual fixtures

- [x] 3.1 Remove obsolete messages and keep all six locale catalogs complete for System, Georgia, Bold, tooltips, and accessible names.
- [x] 3.2 Update architecture, usage, privacy, performance, and screenshot documentation for toolbar composition and local typography compatibility.
- [x] 3.3 Update the existing demo-editor and Editor Image export frames without increasing the 59-frame gallery.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit tests, dev check, server build, browser tests, Pages build/check, public check, strict OpenSpec validation, and git diff checks.
- [x] 4.2 Generate the 59-frame gallery twice, visually inspect every PNG, and compare deterministic SHA-256 hashes.
- [x] 4.3 Sync the organization-editor delta into canonical specs, archive the change, validate no active changes, commit, integrate current origin/main, merge and push main, delete the temporary branch, and verify a clean synchronized repository.

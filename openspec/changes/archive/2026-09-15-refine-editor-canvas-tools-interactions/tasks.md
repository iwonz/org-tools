## 1. Selection and element commands

- [x] 1.1 Make plain element selection exclusive and make every creation-tool activation clear existing canvas selection and transient element editing state.
- [x] 1.2 Add an element-targeted right-click menu with layer, z-order, duplicate, and delete commands while preventing canvas and Unit menus from opening.
- [x] 1.3 Add focused interaction tests for exclusive selection, tool switching, and context-menu command routing.

## 2. Transform geometry

- [x] 2.1 Define shared eight-direction resize handles and four corner rotation targets for single and grouped canvas-element frames.
- [x] 2.2 Implement side/corner resize geometry, minimum-size and Image aspect-lock behavior, and center-based rotation previews with one history commit.
- [x] 2.3 Add pure geometry and store/component tests covering every handle direction, fixed opposite edges, centered rotation, groups, and Undo/Redo.

## 3. Toolbar and View Image export

- [x] 3.1 Remove the tools/export divider and restructure contextual properties into compact responsive groups with readable bounded controls.
- [x] 3.2 Reuse the shared token-aware Format input in full-View Image export, supply supported Employee/Unit/isBoss tokens, preserve `?` expressions, and add localized conditional help in all six catalogs.
- [x] 3.3 Add matching clipboard/download footer icons and component tests for the full-View dialog controls and rendered conditional format.

## 4. Documentation and browser coverage

- [x] 4.1 Update architecture, usage, privacy, performance, and screenshot guidance for refined canvas interactions without changing the local-only boundary.
- [x] 4.2 Extend server and Pages browser coverage for selection/tool switching, element context actions, all-edge resize, centered rotation, compact properties, and full-View export controls.
- [x] 4.3 Update maintained Editor and full-View export screenshot scenarios without increasing the catalog size.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, dev check, server build, and server/Pages browser tests.
- [x] 5.2 Generate the 59-image gallery twice, inspect every PNG, compare deterministic hashes, then run Pages build/check and public safety checks.
- [x] 5.3 Run strict OpenSpec validation and `git diff --check`, synchronize and archive the change, validate no active changes, commit, merge into updated `main`, push, delete the change branch, and verify a clean synchronized repository.

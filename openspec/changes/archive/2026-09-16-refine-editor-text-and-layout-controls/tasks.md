## 1. State and rich-text layout

- [x] 1.1 Extend shared Text types, constructors, cloning, and exact State parsing with canonical format runs, width mode, and fill while normalizing the preceding Text shape safely.
- [x] 1.2 Implement grapheme-safe format-run editing and one shared mixed-typography line layout with automatic/fixed width, derived height, empty bounds, and fill geometry.
- [x] 1.3 Update rectangle and group transforms so Text width/font sizes drive derived geometry while attachments and centers remain stable.

## 2. Canvas interaction and controls

- [x] 2.1 Replace Text editing with selection-aware contenteditable drafts, plain-text paste, pending caret style, mixed property values, and idempotent single-command completion.
- [x] 2.2 Update Text property controls, width-only handles, fill controls, horizontal alignment, and the Text/Arrow/Sticker tool icons.
- [x] 2.3 Remove redundant Editor and View-settings dividers and make every layout-direction activation arrange the applicable full or selected hierarchy without a standalone Arrange action.

## 3. Fonts and PNG parity

- [x] 3.1 Bundle Bebas Neue and Lobster in server and Pages and expose the five-family resolver and literal named-font labels in canvas and both Image dialogs.
- [x] 3.2 Paint rich Text fragments and block/per-line fills in PNG, wait for every used local font, and preserve scoped/full-View scene and safety behavior.

## 4. Automated coverage

- [x] 4.1 Add unit coverage for strict/preceding State, run normalization, mixed layout, automatic geometry, fills, transforms, attachments, font resolution, and repeated layout commands.
- [x] 4.2 Update server and Pages browser coverage for toolbar simplification, icons, fonts, rich editing, paste, auto-size, fill, attachments, PNG parity, and Undo/Redo.

## 5. Documentation and screenshots

- [x] 5.1 Update organization-editor documentation, architecture, usage, privacy, performance, and all six locale catalogs; remove obsolete Arrange messages.
- [x] 5.2 Update existing Editor/View settings/Image export screenshot scenarios without adding a frame, generate twice, inspect every PNG, and compare deterministic hashes.

## 6. Validation and delivery

- [x] 6.1 Run format, lint, typecheck, unit, dev check, server build, browser tests, Pages build/check, public check, strict OpenSpec validation, and git diff check.
- [x] 6.2 Sync and archive the OpenSpec change, validate no active changes, integrate the latest origin/main, merge and push main, remove the change branch, and verify clean synchronized refs.

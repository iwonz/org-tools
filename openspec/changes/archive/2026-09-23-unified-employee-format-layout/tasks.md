## 1. Shared layout foundation

- [x] 1.1 Add shared normal and compact inline-surface metrics, grapheme-safe wrapping, and fragment layout types with bounded caching
- [x] 1.2 Update Employee rich layout so text, Markdown, Tags, and assignments share rows and produce content-sized decorated fragments
- [x] 1.3 Add unit coverage for mixed nodes, multilingual wrapping, suffixes, RTL, both densities, and deterministic layout reuse

## 2. DOM and Canvas parity

- [x] 2.1 Render Employee cards and Editor rows from the shared fragments while preserving links, highlights, dates, and assignment actions
- [x] 2.2 Drive Editor row heights, offsets, hit testing, anchors, Unit bounds, open positions, and Tag footers from the shared compact layout
- [x] 2.3 Paint the same fragments in PNG and cover geometry, colors, typography, spacing, and custom-font behavior

## 3. Shared Tag surfaces

- [x] 3.1 Introduce the shared Tag surface and migrate cards, forms, pickers, filters, catalog, Calendar, color previews, Editor, and drag previews
- [x] 3.2 Replace fixed virtual Tag row heights with measured rows and verify resizing, locale, direction, actions, and accessibility

## 4. Format authoring

- [x] 4.1 Make both PNG Employee-format fields use the shared token builder and Markdown-enabled TemplateFormatInput
- [x] 4.2 Remove the scoped PNG token buttons and raw textarea while keeping plain-text Template formats unchanged
- [x] 4.3 Add browser coverage for all six visual formats, multiline editing, token suggestions, Markdown tools, and the removed token catalog

## 5. Documentation and visible coverage

- [x] 5.1 Update architecture, usage, performance, privacy, screenshots, and all six locale catalogs as applicable
- [x] 5.2 Update maintained fixtures and browser scenarios for long Latin, Cyrillic, Arabic, CJK, and emoji Tag content across shared surfaces

## 6. Validation and delivery

- [x] 6.1 Run format, lint, typecheck, unit tests, dev check, production build, and browser tests
- [x] 6.2 Generate the complete screenshot gallery twice, compare hashes, and inspect every PNG
- [x] 6.3 Run Pages build/check, public safety scan, strict OpenSpec validation, and git diff checks while confirming the State shape is unchanged
- [x] 6.4 Sync and archive the OpenSpec change, integrate current origin/main, merge and push main, delete the change branch, and verify a clean synchronized repository

## 1. Used-color derivation

- [x] 1.1 Add a pure collector for every durable Tag and View color with resolved-RGBA
  deduplication, stable ordering, alpha preservation, and unit coverage.
- [x] 1.2 Expose the derived palette through the organization store without State cloning,
  persistence, or closed-picker render work.

## 2. Shared picker and Editor icons

- [x] 2.1 Add the compact accessible Used colors swatch section to `TagColorPicker`, preserving
  exact alpha and the existing Apply/Cancel transaction in every consumer.
- [x] 2.2 Replace the Arrow tool SVG with one cubic curve and filled end triangle and replace Image
  with the rounded-square photo glyph without changing tool behavior.
- [x] 2.3 Add `Used colors` to all six locale catalogs and update architecture, usage, privacy, and
  screenshot documentation.

## 3. Automated and visual evidence

- [x] 3.1 Extend Server and Pages browser coverage for all picker consumers, inactive-View colors,
  alpha, atomic writes/history, keyboard, RTL, narrow layout, and exact tool glyphs.
- [x] 3.2 Update existing Editor and color-picker screenshots without adding a scenario, generate the
  59-frame gallery twice, inspect every PNG, and compare SHA-256 manifests.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit tests, dev check, server build, Server/Pages browser tests,
  Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 4.2 Synchronize and archive the OpenSpec change, verify no active changes, integrate current
  origin/main, merge and push main, delete the change branch, and prove clean matching
  HEAD/main/origin/main.

## 1. Canvas attachment and resize interaction

- [x] 1.1 Replace resting rectangle connector handles with one transient hovered-owner outline and
  complete anchor set during Arrow creation or attachment gestures, using bounded spatial and row
  geometry lookup.
- [x] 1.2 Start Arrows from exact revealed anchors, preserve free-canvas starts, nearest-anchor snap,
  dependency validation, transient RAF previews, and one-command commits.
- [x] 1.3 Remove the Image aspect-lock property control and route live Shift state through single
  Image resize geometry while retaining independent ordinary and property-field resize behavior.
- [x] 1.4 Add unit and server/Pages browser coverage for hidden resting anchors, hovered owner
  outlines and complete anchors, exact attached Arrow starts, snap commits, and Shift-only Image
  proportions across zoom levels.

## 2. Sticker, fonts, and toolbar presentation

- [x] 2.1 Implement one shared folded-paper Sticker treatment in DOM and PNG without changing bounds,
  anchors, typography layout, selection, or hit testing.
- [x] 2.2 Canonicalize and verify bundled Text/Sticker font loading and application for DOM
  measurement and PNG painting across supported families and weights.
- [x] 2.3 Make the View Image export label normal weight and update unit/browser assertions for
  toolbar typography, Sticker parity, font selection, and exclusion of transient attachment chrome
  from PNG.

## 3. Template empty-line output policy

- [x] 3.1 Add shared pure Template line filtering and bounded line-count helpers with whitespace,
  terminal-separator, disabled-output, multiline, and large-row unit coverage.
- [x] 3.2 Add the transient Remove empty lines checkbox to both Template export surfaces and route it
  through preview, Copy/Download, All Units/First Unit counts, and shown/total metadata.
- [x] 3.3 Add all six localized messages and server/Pages browser coverage proving filtered preview,
  counters, clipboard/download output, and unchanged JSON behavior.

## 4. Documentation and gallery

- [x] 4.1 Update architecture, usage, privacy, performance, canonical capability specs, and screenshot
  documentation for contextual attachments, Shift resize, Sticker/font parity, and Template line
  filtering.
- [x] 4.2 Update the existing Editor and Template export screenshot scenarios without increasing the
  59-frame catalog, and visually inspect all generated PNGs in both themes and all locales.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, development check, server build, and both-runtime
  browser tests.
- [x] 5.2 Generate the screenshot gallery twice, inspect every PNG, and compare deterministic hashes.
- [x] 5.3 Run Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.
- [x] 5.4 Synchronize and archive the change, validate no active changes, integrate current
  `origin/main`, merge and publish `main`, delete the change branch, and verify a clean synchronized
  final repository.

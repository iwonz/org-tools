## 1. Shared layout model

- [x] 1.1 Add measured format blocks to the shared Employee display layout while retaining flattened global visual-row coordinates.
- [x] 1.2 Apply the saved line gap only between blocks and ordinary text wraps while preserving the native six-pixel gap inside wrapped Tag and assignment collections.
- [x] 1.3 Render measured and fallback list-card information columns as nested vertical block stacks with no outer spacing.

## 2. Editor and PNG parity

- [x] 2.1 Keep Editor row heights, Unit bounds, hit testing, and anchors derived from the shared block layout.
- [x] 2.2 Keep Editor PNG row positions and heights derived from the same flattened global coordinates without a second wrapping calculation.

## 3. Automated coverage

- [x] 3.1 Add unit coverage for gaps 0, 4, and 24 across adjacent blocks, wrapped text, wrapped Tags, dated suffixes, assignments, grapheme wrapping, mixed inline content, empty rows, and disappearing conditional rows.
- [x] 3.2 Add browser coverage for nested flex geometry in all four display previews and for Employee, Unit, Editor, and Editor-export destinations.
- [x] 3.3 Verify Tag typography, padding, radius, color, six-pixel horizontal and internal vertical packing remain unchanged.

## 4. Documentation and screenshots

- [x] 4.1 Update architecture, usage, performance, privacy, and screenshot documentation for the nested format-block spacing contract.
- [x] 4.2 Regenerate the maintained 59-image gallery twice, compare hashes, and visually inspect every image.

## 5. Validation and delivery

- [x] 5.1 Run formatting, lint, type checking, unit tests, development probe, production build, browser tests, Pages build/check, public scan, strict OpenSpec validation, and diff checks.
- [x] 5.2 Confirm the owned SQLite State remains current and unchanged, with no conversion required.
- [x] 5.3 Synchronize canonical specs, archive the change, validate no active changes, integrate current origin/main, push main, remove the change branch, and verify a clean synchronized repository.

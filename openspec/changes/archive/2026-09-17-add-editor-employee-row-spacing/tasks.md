## 1. Shared row geometry

- [x] 1.1 Add the four-pixel interior row-gap constant and a pure shared prefix-offset/total-height
  calculation, then apply it to Unit sizing, virtualization, hit testing, anchors, and hierarchy
  geometry with first/single/last and variable-height unit tests.
- [x] 1.2 Apply the shared gap to non-virtual and virtual DOM row placement for Employee and open
  position rows without changing their surface or content bounds.
- [x] 1.3 Reuse the shared offsets in full-View and Unit/subtree PNG planning and extend painter tests
  for mixed rows, vacancy outlines, footer placement, and attachment anchors.

## 2. Evidence and documentation

- [x] 2.1 Extend Server and Pages browser coverage for exact first/middle/last gaps, mixed rows,
  collapse, virtualization, drag/drop, and attached element geometry.
- [x] 2.2 Update organization-editor, architecture, usage, performance, and screenshot documentation.
- [x] 2.3 Regenerate the existing 59-frame gallery twice, visually inspect every PNG, and compare
  SHA-256 manifests without adding a scenario.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit tests, dev check, Server/Pages builds and browser tests,
  Pages/public checks, strict OpenSpec validation, and `git diff --check`.
- [x] 3.2 Synchronize and archive the OpenSpec change, verify no active changes, integrate current
  origin/main, merge and push main, delete the change branch, and prove clean matching
  HEAD/main/origin/main.

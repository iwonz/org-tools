## 1. Shared workflow header

- [x] 1.1 Add an effect-registered responsive context-header action slot without render-phase updates.
- [x] 1.2 Move Add Team, Add Employee, and Download Continue into the header with right-side icons and remove duplicates.
- [x] 1.3 Cover header actions, responsive geometry, localization, and console safety in browser tests.

## 2. Editor visual controls

- [x] 2.1 Keep selected Team nodes opaque with border-only selection and restore the shared styled View Select.
- [x] 2.2 Normalize Arrange and Collapse/Expand typography and right-side icons.
- [x] 2.3 Clear Search on close and omit the empty-query helper surface.
- [x] 2.4 Add light/dark browser assertions for selection, Select, toolbar weight, icon order, and Search cleanup.

## 3. Editor interaction performance

- [x] 3.1 Add reusable frame-coalescing and spatial-index utilities with 24-unit and 4,000-Unit unit coverage.
- [x] 3.2 Move pan and wheel zoom to transient frame-bounded viewport previews with one final viewport commit.
- [x] 3.3 Move Team drag to transient preview positions with one snapped overlap-resolved command on release.
- [x] 3.4 Add large-canvas browser coverage for preview write isolation, single final commits, culling, and console safety.

## 4. Calendar and MCP regressions

- [x] 4.1 Render Calendar dated-tag labels, shared middle dots, and counts with uniform spacing and test it.
- [x] 4.2 Verify fresh-database MCP off, explicit setting persistence, and complete Pages MCP isolation.

## 5. Documentation and visual catalog

- [x] 5.1 Update architecture, usage, performance, screenshot documentation, and the canonical 43-frame count.
- [x] 5.2 Regenerate all 43 PNGs, inspect affected workflows in both themes/locales, and verify deterministic hashes.

## 6. Validation and delivery readiness

- [x] 6.1 Run format, lint, typecheck, unit, dev check, both builds, browser suites, Pages/public checks, and diff check.
- [x] 6.2 Synchronize delta specs, archive the change, validate strictly, and confirm no active OpenSpec changes.
- [x] 6.3 Commit the complete change and verify a clean publication-safe change branch.

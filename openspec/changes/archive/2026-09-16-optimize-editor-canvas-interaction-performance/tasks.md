## 1. Viewport and scene invalidation

- [x] 1.1 Add tested buffered render-window and transient viewport-controller primitives.
- [x] 1.2 Move pan and zoom world transforms, grid styles, and inverse-zoom metrics out of the main Editor React render loop while preserving one final viewport commit.
- [x] 1.3 Memoize stable Unit, connection, and canvas-element layers with stable per-node inputs and isolate transient overlays and dependency previews.
- [x] 1.4 Replace render-phase geometry cache mutation and repeated collection scans with indexed scene derivation.

## 2. Rich-text layout and editing

- [x] 2.1 Add a bounded shared measurement/layout engine with one canvas context, prepared metrics, font generations, and layout revisions.
- [x] 2.2 Centralize local font readiness and make resting DOM, draft DOM, bounds, anchors, and PNG use the canonical layout result.
- [x] 2.3 Localize contenteditable draft and selection updates, use exact input ranges with a compatibility fallback, coalesce layout, and preserve one final history command.
- [x] 2.4 Add unit coverage for layout equivalence, cache invalidation, Unicode formatting, font readiness, and editing transaction semantics.

## 3. Performance contracts

- [x] 3.1 Add opt-in local-only render, layout, measurement, and invalidation diagnostics.
- [x] 3.2 Extend server and Pages browser coverage with 20,000 Employees, 4,000 expanded Units, 1,200 annotations, attachments, and long rich text.
- [x] 3.3 Verify buffered pan/zoom, targeted gesture invalidation, single-write commits, frame budgets, and long-text input latency.

## 4. Documentation and specification

- [x] 4.1 Update architecture and performance documentation for the viewport controller, render window, scene isolation, and rich-text cache.
- [x] 4.2 Keep the organization-editor capability delta and OpenSpec artifacts aligned with the implemented behavior.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, dev check, server build, browser tests, Pages build/check, public check, strict OpenSpec validation, and diff check.
- [x] 5.2 Generate the screenshot gallery twice, inspect all PNGs, and compare deterministic SHA-256 hashes.
- [x] 5.3 Synchronize and archive the OpenSpec change, validate no active changes, merge into current main, publish main, remove the change branch, and verify a clean synchronized repository.

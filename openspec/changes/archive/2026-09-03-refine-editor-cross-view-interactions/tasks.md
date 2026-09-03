## 1. Shared footer layout

- [x] 1.1 Implement a grapheme-safe shared Unit Tag footer layout with intrinsic short chips, wrapped long labels, and an indivisible count suffix.
- [x] 1.2 Use the shared layout for DOM Unit cards, Unit geometry, and PNG rendering without ellipsis.
- [x] 1.3 Add multilingual wrapping and DOM/PNG geometry unit and browser coverage.

## 2. Cross-View clipboard

- [x] 2.1 Move the transient clipboard to the View collection and clear it on complete state replacement.
- [x] 2.2 Implement cross-View Unit ID, hierarchy, and Live-rule remapping with copy-time membership materialization for external dependencies.
- [x] 2.3 Route keyboard and context-menu Copy/Paste through the shared coordinator and verify target-only Undo.

## 3. Editor interactions

- [x] 3.1 Suppress custom and native tooltips for View management controls while retaining accessible labels and keyboard behavior.
- [x] 3.2 Add the pure bounded quadratic edge-pan calculation and one frame-coalesced controller for Unit, Employee, connection, and marquee drags.
- [x] 3.3 Keep marquee and drag previews document-anchored, commit viewport and structure once on release, and restore previews on cancellation.

## 4. Atomic deletion

- [x] 4.1 Implement one Unit deletion coordinator with deduplicated descendant closure and Live dependency materialization.
- [x] 4.2 Prune Editor, system Unit, expansion, filter, and active Download references before notifying persistence.
- [x] 4.3 Route all Editor and Units deletion entry points through the coordinator and cover nested and multi-selection reload behavior.

## 5. Documentation and validation

- [x] 5.1 Update architecture, usage, performance, and screenshot documentation for shared clipboard, edge-pan, wrapped footer geometry, and atomic deletion.
- [x] 5.2 Update browser suites for both runtimes and the 20,000 Employee / 4,000 Unit performance fixture without console or external-network diagnostics.
- [x] 5.3 Regenerate and visually inspect all 52 PNGs twice and confirm identical SHA-256 manifests.
- [x] 5.4 Run format, lint, typecheck, unit, dev check, both builds, both browser suites, Pages/public checks, strict OpenSpec validation, and diff checks.
- [x] 5.5 Synchronize canonical specs, archive the completed change, commit, merge and push `main`, delete the merged branch, and verify a clean synchronized repository with no active changes.

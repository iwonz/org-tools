## 1. Compact shared footer geometry

- [x] 1.1 Replace the uniform worst-case width reserve with deterministic glyph-aware content measurement.
- [x] 1.2 Use the shared compact width for live chips, row packing, bounds, overlap, spatial indexing, and PNG painting.
- [x] 1.3 Add unit coverage for representative labels, equal insets, row packing, caps, and canvas parity.

## 2. Product validation and documentation

- [x] 2.1 Add browser coverage for compact chip widths and stable Unit geometry in server and Pages runtimes.
- [x] 2.2 Update architecture, usage, performance, screenshot guidance, and affected Editor frames.
- [x] 2.3 Run the complete verification suite, inspect all 52 PNGs, and confirm two identical hash manifests.

## 3. Delivery

- [x] 3.1 Synchronize canonical specs, archive the change, and verify that no active changes remain.
- [x] 3.2 Commit, fast-forward merge into main, push GitHub, delete the merged branch, and verify clean synchronized refs.

## 1. State and geometry foundations

- [x] 1.1 Add exact canvas-element, typography, anchor, attachment, and element-selection types plus defaults and cloning helpers.
- [x] 1.2 Extend strict State parsing, serialization, View loading/cloning, history, equality, and sanitization for required canvas elements.
- [x] 1.3 Implement shared element geometry, text layout, transforms, anchors, dependency/cycle resolution, scoped inclusion, and spatial lookup with unit tests.

## 2. Store commands and local images

- [x] 2.1 Implement element creation, property editing, selection, transient-to-command transforms, layer ordering, deletion/detachment, and Undo/Redo.
- [x] 2.2 Extend same-View and cross-View Copy/Paste/Duplicate with Unit/element ID and anchor remapping.
- [x] 2.3 Implement bounded local PNG/JPEG/WebP file and clipboard decoding, exact data-URL validation, State-size rejection, and unit tests.

## 3. Editor tools and interactions

- [x] 3.1 Add the upper-right tools surface, Select/Text/Arrow/Sticker/Image creation flows, contextual property controls, and complete six-locale copy.
- [x] 3.2 Render both element planes through shared geometry and implement selection, marquee, move, resize, rotation, Bezier controls, anchors, group transforms, and keyboard commands.
- [x] 3.3 Add bounded element/dependency indexes and frame-coalesced previews without full-collection pointer scans or preview writes.

## 4. Shared PNG pipeline

- [x] 4.1 Refactor Unit image export around a shared scene/render-plan API with exact element/card bounds, 1x/2x/3x density, 8/32-megapixel caps, and final dimension metadata.
- [x] 4.2 Paint Text, Sticker, Image, Arrow, layers, attachments, and failure placeholders with DOM/PNG parity; include only related annotations in Unit/subtree scope.
- [x] 4.3 Add the image-only full-View export dialog and toolbar action with preview, dimensions, settings, Copy, Save, and sanitized View filename.

## 5. Contracts and documentation

- [x] 5.1 Update the product invariant, architecture, usage, privacy, performance, and screenshot catalog documentation in English.
- [x] 5.2 Update all exact-schema fixtures and maintain complete State, server/Pages synchronization, and public-safety expectations.

## 6. Automated and visual coverage

- [x] 6.1 Add unit coverage for State validation, anchors, cycles, transforms, layers, history, deletion, View clone/cross-View paste, image bounds, and render-plan geometry.
- [x] 6.2 Add server and Pages browser coverage for all tools, attachment movement, clipboard image, group editing, full/scoped PNG, density metadata, local-only behavior, and transient exclusion.
- [x] 6.3 Update `demo-editor`, `editor-image-export`, and `editor-image-settings` with deterministic synthetic elements while retaining exactly 59 gallery frames.

## 7. Validation and delivery

- [x] 7.1 Run formatting, lint, typecheck, unit tests, development check, production build, browser tests, Pages build/check, public check, strict OpenSpec validation, and diff checks.
- [x] 7.2 Generate and visually inspect every gallery PNG twice and verify deterministic hashes.
- [x] 7.3 Synchronize canonical specs, archive the change, integrate current origin/main, merge and push main, delete the merged branch, and verify a clean synchronized repository with no active changes.

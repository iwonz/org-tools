## 1. Gesture and distribution scope

- [x] 1.1 Classify primary blank-canvas click versus pan so real pan and cancellation preserve Employee selection and distribution connections.
- [x] 1.2 Add deterministic selected/descendant scope derivation and tri-state distribution toggles that leave outside Units unchanged.
- [x] 1.3 Add the accessible distribution scope submenu with pointer, keyboard, RTL, focus, and viewport-aware placement behavior.

## 2. Clipboard arbitration

- [x] 2.1 Add a transient token to successful Editor clipboard copies and clear it with the existing complete-State clipboard lifecycle.
- [x] 2.2 Stamp keyboard and context-menu copies with content-free system markers and arbitrate matching structure, newer image, foreign content, fallback, and late events once.
- [x] 2.3 Preserve cross-View remapping, context-menu Paste, repeated keyboard Paste, Undo boundaries, and image insertion.

## 3. Coverage and documentation

- [x] 3.1 Add unit coverage for gesture classification, branch closure, tri-state updates, marker parsing, source priority, and clipboard clearing.
- [x] 3.2 Add browser coverage for off-screen distribution pan, submenu scopes and accessibility, cross-View keyboard copy/paste, later image copy, and single Undo operations.
- [x] 3.3 Update architecture, usage, performance, privacy, screenshots, six locale catalogs, and the maintained distribution gallery frame without changing the 56-frame manifest.

## 4. Verification and delivery

- [x] 4.1 Run format, lint, typecheck, unit tests, development check, production build, both browser suites, Pages build/check, public-safety scan, strict OpenSpec validation, and diff checks.
- [x] 4.2 Generate the 56-frame gallery twice, compare deterministic hashes, and visually inspect every PNG.
- [x] 4.3 Synchronize and archive the OpenSpec change, integrate current origin/main, merge and push main, delete the completed branch, and verify clean synchronized refs with no active changes.

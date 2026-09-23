## 1. Display token contract

- [x] 1.1 Add display-only `{positions}` resolution, compound rich nodes, localized missing-position text, and plain `{position}` and `{unitName}` output.
- [x] 1.2 Change blank-state Employees and Units formats and expose the token in Display suggestions with legacy custom-key precedence and new-key reservation.
- [x] 1.3 Remove automatic `mailto:` behavior from plain `{email}` while retaining explicit safe Markdown links.

## 2. DOM and Canvas parity

- [x] 2.1 Render the previous `Position · Unit` pill treatment in list and compact Employee cards with highlighting and safe Unit navigation.
- [x] 2.2 Measure compound pills in shared Editor row geometry and paint matching segmented pills in scoped and full-View PNG output.

## 3. Tests and documentation

- [x] 3.1 Add unit coverage for token semantics, defaults, key compatibility, email linking, compound packing, and Canvas output helpers.
- [x] 3.2 Extend browser smoke coverage for Display previews, plain and explicit linked email, assignment navigation, Editor geometry, and PNG output.
- [x] 3.3 Update architecture, usage, performance, privacy, screenshots, maintained fixtures, and all locale-catalog expectations.

## 4. Validation and delivery

- [x] 4.1 Run formatting, lint, typecheck, unit tests, development probe, production build, and browser tests.
- [x] 4.2 Generate and visually inspect all 59 screenshots, regenerate them, and compare deterministic hashes.
- [x] 4.3 Build and check Pages, run the public-safety scan, strict OpenSpec validation, and `git diff --check`.
- [x] 4.4 Synchronize canonical specs, archive the OpenSpec change, and prepare the verified branch for repository integration.

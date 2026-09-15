## 1. Geometry and transform chrome

- [x] 1.1 Add shared integer dimension normalization and apply it to rectangle resize, group
  transforms, text fitting, and property edits while retaining State compatibility.
- [x] 1.2 Replace the rectangle and group frames with zoom-independent solid outlines, four visible
  corner resize handles, invisible side resize and outside-corner rotation targets, and contextual
  connector affordances.
- [x] 1.3 Preserve exact single-element and group rotation centers, attachment offsets, nearest-anchor
  feedback, and one-command transform commits.

## 2. Toolbar and text interaction

- [x] 2.1 Replace the Text tool icon, remove plane controls and obsolete messages, and retain
  within-plane ordering actions.
- [x] 2.2 Route text completion idempotently through canvas pointer capture, blur, Escape, and tool
  changes with the specified selection behavior.

## 3. Tests and documentation

- [x] 3.1 Add unit coverage for integer geometry, aspect lock, text fitting, rotation centers,
  attachments, group transforms, and fractional-State compatibility.
- [x] 3.2 Update server and Pages browser workflows for transform chrome, zoom, integer dimensions,
  contextual anchors, plane-action removal, text completion, selection, history, and PNG exclusion.
- [x] 3.3 Update architecture, usage, performance, screenshot documentation, the canonical screenshot
  scenario, and all affected locale catalogs.

## 4. Validation

- [x] 4.1 Run format, lint, typecheck, unit tests, development check, server build, and both-runtime
  browser tests.
- [x] 4.2 Generate the screenshot gallery twice, inspect every PNG, and compare deterministic hashes.
- [x] 4.3 Run Pages build/check, public check, strict OpenSpec validation, and `git diff --check`.

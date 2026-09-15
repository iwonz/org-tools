## Why

Canvas-element transforms currently expose too many persistent handles, scale with the View zoom,
and can persist fractional rectangle sizes. Text editing also relies on blur ordering that makes an
outside click inconsistent. The Editor needs a restrained Miro-like interaction model whose visual
affordances, geometry, selection, and history behavior stay predictable in both runtimes.

## What Changes

- Replace the selected rectangle and group chrome with a thin solid frame, four visible corner
  resize handles, invisible side resize targets, and invisible outside-corner rotation targets whose
  screen size is independent of View zoom.
- Hide persistent anchor markers and reveal only compact connector affordances and the nearest valid
  target while an attachment gesture needs them.
- Quantize rectangular canvas-element width and height to whole logical pixels during previews,
  commits, property edits, text fitting, and group transforms while preserving fixed resize geometry
  and locked Image proportions.
- Remove user-facing `behindUnits` / `aboveUnits` plane switches while retaining the two internal
  planes, defaults, persistence, and within-plane ordering commands.
- Use a letter `T` for the Text tool and make outside-click and Escape text-edit completion explicit,
  deterministic, and limited to one history command.
- Update the Editor interaction contract, documentation, browser coverage, and existing screenshot
  gallery. PNG continues to render committed content and geometry without transient selection chrome.
- Preserve local-only behavior. No organization data, images, or interaction data leaves the browser
  or loopback runtime.
- Preserve the current State schema and accept existing fractional dimensions. No migration,
  compatibility reader, remote dependency, new export format, or new canvas-element type is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Refine canvas-element transform chrome, integer dimension editing, plane
  controls, attachment affordances, Text tool presentation, and text-edit selection semantics.

## Impact

The change affects Editor canvas element rendering and gesture routing, shared geometry helpers,
the canvas toolbar and element context menu, unit and browser tests, all six locale catalogs,
OpenSpec, and Editor architecture, usage, performance, and screenshot documentation. The durable
canvas-element union, layer field, persistence, Copy/Paste, history, and PNG scene contract remain
compatible.

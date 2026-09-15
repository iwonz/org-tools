## Why

Canvas attachments still expose misleading connection points at rest, Image resizing uses a visible
lock control instead of a gesture modifier, and Sticker and font rendering do not yet communicate
their intended presentation reliably. Template export also cannot remove whitespace-only rows, so
preview and output counts can disagree with the useful content users intend to copy or download.

## What Changes

- Make the Editor canvas attachment UI contextual: hide connector points at rest, reveal all anchors
  and a target outline for the hovered owner while creating or reconnecting an Arrow, and allow an
  Arrow to start from an exact hovered anchor.
- Remove the Image aspect-lock control and preserve proportions only while Shift is held during a
  resize gesture; ordinary resizing remains independent by axis.
- Give Sticker a recognizable folded-paper treatment in both the live Editor and PNG output, and
  verify that bundled font choices are loaded and applied consistently to Text and Sticker in DOM
  and PNG rendering.
- Use normal font weight for the View Image export action.
- Add one shared **Remove empty lines** Template option whose whitespace-only line filtering is used
  by bounded preview, complete Copy/Download output, and every displayed row or line count.
- Update the Editor and data-export contracts, documentation, locale catalogs, browser coverage, and
  existing screenshot gallery.
- Preserve local-only behavior. Text, organization data, and embedded images remain in browser
  memory or the loopback runtime and never reach a third party.
- Preserve the current State schema and export file types. No migration, compatibility reader,
  remote dependency, new canvas-element type, or image re-encoding is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Refine contextual anchor discovery, Arrow creation, Shift-only Image
  aspect resizing, Sticker presentation, bundled font application, and toolbar typography.
- `data-export`: Add consistent whitespace-only line removal and filtered line counts to both
  Template export surfaces.

## Impact

The change affects Editor canvas element rendering and pointer routing, shared attachment geometry,
the canvas toolbar and PNG painter, shared Template formatting/settings and counters, unit and
browser tests, all six locale catalogs, OpenSpec, and architecture, usage, privacy, performance, and
screenshot documentation. Existing canvas elements, anchor references, state persistence, history,
Copy/Paste, JSON export, and PNG scene composition remain compatible.

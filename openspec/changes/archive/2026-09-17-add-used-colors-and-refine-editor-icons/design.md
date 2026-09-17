## Context

`TagColorPicker` is the one shared Popover used by the Tag catalog, View distribution settings,
open positions, and Text, Sticker, and Arrow properties. It already owns a transactional color plus
opacity draft. Persisted colors live in global Tag definitions or in each View's settings, Units,
open positions, and canvas elements. The toolbar currently uses a local curved-arrow SVG with an
open line arrowhead and `HiOutlinePhoto` for Image.

The application must remain local-only, preserve the strict State shape, and avoid repeated
full-document work during ordinary Editor rendering at the maintained large-data target.

## Goals / Non-Goals

**Goals:**

- Expose every distinct configured organization color in every shared picker.
- Preserve exact alpha, deterministic ordering, keyboard access, and the existing atomic draft
  workflow.
- Refine Arrow and Image glyphs without changing tool behavior or accessible names.
- Keep collection bounded to current in-memory State and inexpensive while the picker is closed.

**Non-Goals:**

- Persisting recent-color history or adding a State/SQLite field.
- Including transient drafts, clipboard content, or native Image-export color inputs.
- Changing canvas Arrow geometry, Image rendering, exported PNG content, or color encoding.

## Decisions

### Derive one organization-wide palette from durable color-bearing fields

A pure collector will visit global Tag definitions first, followed by every View in stable View
order. Within a View it will visit distribution settings, Units/open positions, and ordered canvas
elements, including base and format-run typography, Text fill, Sticker background, and Arrow stroke.
It will skip null and transient values. A MobX computed store getter will expose the result without
serializing or cloning complete State; the picker will subscribe only while open.

The collector will key values by their resolved lowercase `#rrggbb` or `#rrggbbaa` appearance.
Equivalent named and custom opaque values collapse to the first encountered value, while different
alpha bytes, including `00`, remain distinct. First occurrence defines stable display order and the
list has no arbitrary cap.

Alternatives considered were a persisted MRU history, which changes State and retains unused data,
and active-View-only collection, which makes colors disappear when switching Views. Both conflict
with the requested organization-wide reuse model.

### Extend the existing draft rather than adding a second commit path

Used colors will render in a labeled wrapping listbox between exact input and named presets. Each
28-pixel swatch will paint the exact RGBA over a checkerboard, expose a localized accessible label
and tooltip, and reserve an internal selection mark. Activating a swatch replaces both base color
and opacity in the existing local draft. Only the existing Apply action calls `onChange`; Cancel,
Escape, outside dismissal, invalid input, and unchanged Apply remain no-ops.

The section is absent when no configured color exists. A newly applied color appears on the next
open after the owning store mutation; a color removed from its last durable source disappears.

### Use a local Arrow SVG and the existing rounded photo icon

Arrow will use a single cubic path with no start decoration and a separate filled triangular end
marker aligned to the curve tangent. Image will use the bundled `TbPhotoSquareRounded` icon. Both
continue to inherit the toolbar button's localized accessible name and active styling, so no runtime
dependency or exported-canvas behavior changes.

## Risks / Trade-offs

- **A document with many unique colors can lengthen the Popover** → retain its bounded internal
  scrolling and wrapping layout; do not truncate data.
- **A zero-alpha swatch is visually empty** → show the checkerboard, boundary, tooltip, and stable
  selection mark independently of the fill.
- **Scanning all Views could regress Editor rendering** → perform collection in a computed derived
  getter, avoid State cloning, and do not observe the getter from closed picker instances.
- **Named and custom values can render identically** → deduplicate by resolved RGBA while retaining
  the first stored representation for draft application.

## Migration Plan

No migration is required. The change adds only derived runtime data and UI rendering. Rollback is a
code rollback with no State conversion or SQLite handling.

## Open Questions

None.

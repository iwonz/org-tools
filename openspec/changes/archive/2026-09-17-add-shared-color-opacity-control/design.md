## Context

`TagColorPicker` is the shared Popover for global Tag colors, View distribution colors, open-
position backgrounds, and Text, Sticker, and Arrow properties. It currently owns transient HSV and
exact-input state, but completed gestures and named options call `onChange` immediately, named
options use full-width rows, and alpha is editable only through RGBA text. The persisted
`EmployeeTagColor` contract already accepts semantic names or canonical lowercase `#rrggbb[aa]`.

Canvas tools already pass eight-digit HEX directly to DOM, SVG, and Canvas. Shared Tag surfaces,
distribution rows, and open positions instead derive opaque tonal fills from alpha colors, so those
consumers need one common transparency rule to preserve DOM/PNG parity. All processing remains local
to the browser and loopback runtime.

## Goals / Non-Goals

**Goals:**

- Make opacity an independent, accessible zero-through-one-hundred percent control in every shared
  dropdown color picker.
- Let users review color plus opacity and produce at most one mutation, history entry, or sync write
  through an explicit Apply action.
- Preserve exact alpha in live DOM and light-palette PNG output while retaining readable opaque text
  on semantic color surfaces.
- Reduce preset height with one wrapping listbox of filled Tag-like options.

**Non-Goals:**

- Changing the `EmployeeTagColor` or State shape, adding migration or compatibility logic, or
  changing the native Image-export color inputs.
- Adding gradients, per-theme stored colors, remote palettes, dependencies, telemetry, or background
  persistence.

## Decisions

### Model the Popover as one local draft transaction

On open, the picker decomposes the external value into a base color identity, an alpha byte, and
formatted exact-input state. Palette, hue, preset, exact, slider, and percentage edits update only
that draft and the picker preview. Apply validates and encodes the draft, calls `onChange` once only
when the encoded value differs, closes, and restores trigger focus. Cancel, Escape, outside
dismissal, invalid input, or an unchanged Apply performs no callback. An external value replacement
while open resets the draft to that value.

This replaces immediate per-control commits because color and opacity form one user decision. A
live-callback plus multiple history entries was rejected; implicit apply-on-dismiss was rejected
because it makes outside pointer and Escape behavior ambiguous.

### Keep semantic names only at full opacity

The draft retains whether its base came from a named preset. A named base at 100 percent encodes to
the semantic name; an opaque custom base encodes to lowercase six-digit HEX. Any lower opacity
encodes to lowercase eight-digit HEX using the rounded alpha byte, so 40 percent is `0x66` and zero
percent is `00`. `No color` remains `null`; it disables opacity without conflating null with an
invisible configured color. Selecting another color in the same open session restores the previous
draft opacity.

Existing named, six-digit, and eight-digit values decode without mutation. Exact Keyword, HEX, and
RGB edits replace RGB while preserving draft alpha; RGBA replaces both. The full palette remains
opaque as an RGB selector, while its trigger, chips, opacity gradient, and exact preview show the
combined draft.

### Use one compact accessible preset list

The optional No color item and eight localized named colors render as auto-width filled chips inside
one wrapping `role=listbox`. Each option retains `role=option`, `aria-selected`, keyboard focus, and
a fixed selection-mark slot so selection does not change geometry. Apply and Cancel use existing
localized actions; one new `Opacity` message is added to all six catalogs.

### Preserve real alpha and calculate contrast after compositing

Shared color helpers parse alpha once. For a non-opaque custom color, resting DOM fills and Canvas
fill styles retain the exact alpha channel. Light and dark foregrounds remain opaque and are chosen
against the color composited over the corresponding base surface. Hover and active fills adjust RGB
but keep the same alpha. Opaque named and custom colors retain their established restrained tonal
treatment.

The same helpers feed Tag chips, Calendar controls, Unit Tag footers, distribution rows, open
positions, full-View PNG, and scoped PNG. Text foreground/fill, Sticker surface/border, and Arrow
stroke continue to consume the encoded color directly. Persistent background alpha remains beneath
selection and drop feedback, which keeps its existing precedence.

### Keep validation and performance bounded

Opacity input accepts integer percentages from 0 through 100 with step one; invalid or blank input
sets `aria-invalid` and blocks Apply. Slider sampling, hue dragging, and exact typing update only the
small local component. The preset count remains constant, and no organization collection, spatial
index, rich-text layout, persistence layer, or network boundary is touched before Apply.

## Risks / Trade-offs

- **Transparent fills can reduce contrast differently across themes** → choose opaque foregrounds
  after compositing against maintained light and dark base colors and cover both themes.
- **Eight-bit alpha does not represent every integer percentage exactly** → round once to the
  nearest byte and display the corresponding nearest integer percentage without rewriting an
  unchanged imported value.
- **Nested Select and Popover dismissal can accidentally cancel a draft** → retain modal nesting,
  distinguish nested interactions from outside dismissal, and verify focus and Escape in browsers.
- **Changing RGBA surfaces affects many screenshots** → update existing frames only, inspect all 59,
  and require identical hashes from two clean generations.

## Migration Plan

No State or SQLite migration is required. Deploy the picker and renderer together so existing
eight-digit values immediately gain real alpha in DOM and PNG. Rollback restores the preceding
rendering behavior without changing persisted values.

## Open Questions

None.

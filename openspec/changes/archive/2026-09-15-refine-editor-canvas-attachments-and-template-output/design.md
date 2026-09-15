## Context

The Editor already has one persistent anchor registry and transient snapping feedback, but rectangle
elements still paint four connector handles whenever a selected frame is hovered. Arrow creation
starts from arbitrary canvas coordinates, and endpoint dragging retains only one nearest-anchor
marker, so the user cannot inspect the complete attachment vocabulary of the target under the
pointer. Image elements also expose a persisted aspect-lock field as a property toggle even though
the requested interaction is gesture-local Shift behavior.

Text and Sticker use bundled font names in stored typography and Canvas font strings, while the
visible Sticker is only a rounded rectangle. Template output is assembled from row fragments and
its current preview metadata counts source rows rather than the lines that remain in rendered text.
The change must preserve the exact State contract, local-only trust boundary, View-local history,
bounded previews, and DOM/PNG presentation invariant.

## Goals / Non-Goals

**Goals:**

- Make anchor discovery contextual to Arrow creation or an active attachment gesture.
- Use Shift as the only proportional-resize modifier for Images without changing stored State.
- Give Sticker and selected bundled fonts visibly consistent DOM and PNG rendering.
- Add one shared whitespace-only line filter and make Template counters describe filtered output.
- Preserve one-command gesture commits and bounded spatial/render work at Editor scale.

**Non-Goals:**

- Changing the canvas-element discriminated union, attachment references, layer order, or State
  schema.
- Adding remote fonts, remote images, dependencies, telemetry, or new export formats.
- Changing JSON output, custom-field Template evaluation, Employee selection, or Template row-mode
  semantics.
- Persisting the new Remove empty lines checkbox beyond the currently open export surface.

## Decisions

### Resolve one hovered anchor owner and present its complete registry entry

Pointer movement during Arrow creation or endpoint/attachment dragging will use the existing
geometry-keyed spatial candidates to resolve one topmost eligible owner under or nearest the
pointer. The transient interaction state will carry that owner plus its complete valid anchor list;
rendering will paint one zoom-independent outline and every anchor for that owner. The closest
anchor inside the existing screen-space snap radius remains emphasized and is the only anchor
committed on pointer release.

When the Arrow tool is armed but no drag exists, ordinary pointer hover will run the same bounded
owner lookup. Pointer-down on a rendered anchor starts the Arrow with an attached endpoint;
pointer-down elsewhere preserves free-endpoint creation. At rest in Select mode no rectangle
connector markers are painted, including for a selected or focused element. Unit, Employee-row,
rectangle, and Arrow anchor definitions and dependency validation remain unchanged. These outlines
and markers are transient DOM chrome and never enter the shared PNG scene.

This reuses the registry instead of adding per-component anchor lists, keeping future element types
on the same attachment path. Scanning every Unit or Employee row on pointer movement is explicitly
avoided.

### Treat Image proportions as pointer-sample state

The aspect-lock property control will be removed. Rectangle resize will receive the current
`shiftKey` value on every pointer sample and request proportional dimensions only when the selected
item is an Image and Shift is held. Releasing Shift during the same drag immediately returns to
independent-axis sizing; pressing it immediately constrains the preview. The existing persisted
`lockAspectRatio` value remains accepted and serialized for State compatibility but no longer
controls resize behavior or group transforms. Property Width and Height edits remain independent.

The shared integer-dimension normalizer will continue selecting the nearest valid integer pair when
proportional Image resize is requested. Pointer cancellation restores the original geometry and a
successful release remains one history command.

### Render Sticker as folded paper in both presentation paths

Sticker will use its configured background as the base paper tone, a subtle tonal gradient/shadow,
and a small folded top-right corner derived from the same color. The fold is pointer-inert and kept
inside existing element bounds, so geometry, anchors, text padding, selection, and hit testing do
not change. The PNG painter will reproduce the same base, fold geometry, tonal colors, and text
layout using local vector primitives. Invalid image placeholders and all other element types remain
unchanged.

### Use canonical bundled font-family metadata and wait before measurement

One shared font-family quoting helper and the existing canonical ten-family list will feed Text and
Sticker DOM styles, measurement canvases, and PNG painting. DOM rendering will apply the chosen
family directly to the content surface. Before measuring or painting text, the browser will wait on
`document.fonts.load` for the selected family and weight using the same canonical Canvas font
string. Browser assertions will compare computed families for at least two visibly different
choices, while painter tests verify that measurement and rendering receive the selected font.

No external font request is introduced: all families remain bundled in both server and Pages
builds. Nine families provide native 400/500/700 files; PT Sans provides native 400/700 files and
the browser resolves a requested 500 face locally while preserving the same CSS and Canvas font
contract.

### Filter Template lines through one output policy

One pure output helper will split rendered Template text on local line boundaries, treat a line as
empty when `trim()` is empty, and, when enabled, remove those lines before rejoining retained content
with LF. Disabled output remains byte-for-byte equivalent to the current formatter. A terminal line
separator is not counted as an additional visual line; an output with no content has zero lines.

Both Template surfaces will own a transient `removeEmptyLines` boolean and pass it through the
shared settings component, preview builder, asynchronous Copy/Download builder, and row-mode count
calculation. JSON paths ignore it. Full counts will be computed by a streaming line counter over
rendered row fragments so the 50-row/128-KiB preview does not construct complete output. Preview
text is still bounded before display, and Copy/Download remains the only operation that assembles
the complete result.

The shared checkbox sits with Template row behavior. Changing it only recomputes derived local
output and does not write organization/UI State, create history, use browser storage, or make a
request.

### Keep export toolbar typography neutral

The full-View Image export action will explicitly use normal font weight while retaining the
existing icon, size, accessible label, hover behavior, and placement in the uninterrupted tools
surface.

## Risks / Trade-offs

- **[Risk] Dense targets can make several anchors visually overlap.** → Keep marker size constant in
  screen pixels, render one topmost owner only, and emphasize the nearest eligible anchor.
- **[Risk] Hover lookup could regress large-canvas pointer performance.** → Query existing spatial
  indexes and cached Employee row offsets, and update transient state through the current RAF path.
- **[Risk] CSS and Canvas tonal blends can diverge.** → Derive Sticker fold/base colors through one
  pure color helper and test DOM data/style plus painter output against the same values.
- **[Risk] Font loading changes measured wraps after first paint.** → Await the exact selected family
  and weight before Canvas measurement and keep DOM styles canonical; retain the local sans-serif
  fallback for decode failures.
- **[Risk] Counting filtered lines adds O(n) Template evaluation while settings are open.** → Keep
  memory bounded, memoize by rows/format/option, and preserve yielding only for explicit complete
  output; no spatial or organization indexes are rebuilt.

## Migration Plan

No State migration is required. Existing Image `lockAspectRatio` values remain valid but become
non-interactive compatibility data. Rollback restores the former toggle and attachment chrome while
all persisted documents and export settings remain readable.

## Open Questions

None.

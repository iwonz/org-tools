## Context

The Editor renders persistent Unit cards in one transformed world, hierarchy connections in SVG,
and transient selection, drag, and viewport previews in React. View documents currently contain
settings, layout mode, and Units; View UI contains selection, distribution flags, and viewport.
Image export has a Unit-rooted canvas painter with shared card geometry, an 8-megapixel preview cap,
and a 32-megapixel copy/save cap.

Canvas annotations cross these boundaries: they must be strict View document state, resolve anchors
against dynamic Unit and Employee-row geometry, remain responsive during pointer gestures, render
identically through DOM/SVG and Canvas 2D, survive View cloning and cross-View paste, and never load
remote media. The exact unversioned state contract intentionally has no compatibility reader.

## Goals / Non-Goals

**Goals:**

- Provide durable Text, Sticker, embedded Image, and cubic Arrow elements with scalable shared
  geometry, anchor, selection, history, copy/paste, and layer primitives.
- Keep anchor resolution correct when Unit geometry, Employee ordering, collapse, or linked elements
  change, without scanning the complete organization on every pointer frame.
- Render one complete View or one related Unit scope through the same scene and image-plan pipeline,
  with selectable density and observable final pixel dimensions.
- Preserve local-only processing, exact state validation, both runtime modes, localization,
  accessibility, bounded memory, and current screenshot/delivery rules.

**Non-Goals:**

- Do not add remote images, cloud assets, collaboration servers, SVG/PDF export, image cropping,
  freehand drawing, arbitrary polygon paths, or new dependencies.
- Do not add canvas elements to JSON, Template, or general Employee exports.
- Do not make Unit cards freely resizable, rotatable, or reorderable relative to one another.
- Do not retain a reader or migration for the former View structure.

## Decisions

### Persist one normalized element union in each View

`structure.canvasElements` is an ordered discriminated union. Rectangular elements share world
position, size, rotation, layer, and optional attachment. Text and Sticker share bounded typography;
Image stores a verified local data URL plus intrinsic dimensions; Arrow stores two endpoints,
control vectors, endpoint attachments, and line style. Array order is z-order inside the `behindUnits`
or `aboveUnits` plane. This keeps structural document state normalized and makes future element kinds
additive through one registry instead of parallel feature-specific stores.

The union participates in state cloning, equality, history snapshots, View copy, automatic writes,
and live-tab synchronization. Selection gains an element reference but remains View UI state. Exact
validation checks keys, UUIDs, finite geometry, bounds, supported fonts/colors, UTF-8 text limits,
image data URLs and dimensions, anchor kinds, referential integrity, and acyclic dependencies.

Alternative: store tools as View UI because they are visual. Rejected because annotations are user
content that must persist, copy, synchronize, and export independently of a viewport.

### Resolve every attachment through one anchor registry

An anchor reference identifies a Unit, an Employee occurrence (`unitId` plus `employeeId`), or a
canvas element plus a stable anchor ID. Providers return a world point, outward direction, and
availability. Units and rectangular elements expose corners, side centers, and center; Employees
expose left/right row centers; arrows expose start, path midpoint, and end.

Attachments preserve a source anchor and local offset. The resolver memoizes element dependencies,
rejects self-links and cycles, and uses stored fallback geometry when a dynamic Employee occurrence
is unavailable. A collapsed occurrence resolves to the matching Unit side. Deleting a target
materializes every dependent's current world geometry before clearing its reference, so the action
is atomic and undoable.

Alternative: persist absolute geometry after every target move. Rejected because it duplicates
derived state, multiplies writes, and cannot follow row reflow without unrelated document mutation.

### Share pure scene geometry across DOM/SVG and PNG

An element registry owns validation-normalized defaults, text line layout, bounds, anchors, hit
testing, transforms, and Canvas 2D painting for each kind. DOM/SVG components consume the same
resolved geometry and explicit text lines. Units keep their existing shared card geometry. A scene
builder combines hierarchy connections, two element planes, Units, resolved attachments, image
scope, and exact rotated/Bézier bounds.

The full View scene contains all Units and elements regardless of viewport. A collapsed Unit keeps
its collapsed card but does not hide descendant Units from structural export. Unit/subtree scenes
seed the selected Unit closure and Employee occurrences, then include attached rectangular elements
transitively and arrows whose two endpoints belong to included owners. Transient handles, markers,
selection, hover, menus, marquee, and placement overlays never enter the scene.

Alternative: screenshot the DOM. Rejected because viewport virtualization, theme styling,
interaction chrome, browser scaling, and cross-runtime differences make it incomplete and
nondeterministic.

### Separate image planning from rasterization

A reusable render plan returns logical bounds, title/padding layout, requested density, effective
density, final pixel width/height, and clamp information. Preview rasterizes the same plan under 8
megapixels; copy/save use 32 megapixels plus a safe maximum canvas side. Both image dialogs expose
1x/2x/3x with 2x default and display the final dimensions before rendering the final Blob. The
existing Unit export remains a wrapper over the shared pipeline; a new image-only View dialog uses
the complete scene.

Alternative: create a second full-View painter. Rejected because card and annotation parity would
diverge and future persistent presentation changes could miss one export path.

### Keep interaction previews transient and indexed

The upper-right action surface becomes a vertical stack with a tools surface underneath. Creation,
move, group resize/rotate, arrow handles, anchor snapping, and text editing use transient drafts
coalesced through the existing animation-frame pattern; pointer release or edit completion creates
one history command. Multi-element transforms use a common selection frame. Mixed Unit/element
selection permits move/copy/delete but not Unit resize/rotation.

Committed element bounds use a spatial index. Reverse dependency maps limit target-move previews to
affected elements. Snap queries convert a fixed screen radius to world space, query nearby Unit and
element bounds, and derive only nearby Employee rows from existing row offsets. Export may scan its
bounded selected scene once but pointer moves must not scan all Units, Employees, or elements.

### Preserve original local image bytes within existing bounds

File selection and clipboard paste accept only PNG, JPEG, or WebP after explicit user action. Input
is limited to 25 MiB compressed and 40 megapixels, converted to a data URL without remote access or
quality-reducing re-encoding, and rejected atomically if the resulting complete State exceeds the
existing 25 MiB transfer limit. A bounded data-header reader verifies MIME and intrinsic dimensions;
runtime decode failure uses a neutral local placeholder in both renderers. PNG generation loads
verified data URLs with bounded concurrency and releases temporary preview URLs.

## Risks / Trade-offs

- [A large or extremely wide View exceeds browser canvas limits] -> Clamp density by both pixel area
  and side length, show actual dimensions/effective density, and keep preview separately bounded.
- [Attachment chains make transforms expensive] -> Maintain forward/reverse indexes, memoize scene
  resolution, forbid cycles, and recompute only the affected closure during previews.
- [Canvas and browser text metrics drift] -> Use bundled fonts, wait for the selected face, perform
  one grapheme-safe line layout, and position explicit DOM lines and Canvas glyphs from it.
- [Group transforms conflict with external anchors] -> Transform desired world geometry once and
  recompute attachment offsets relative to the resolved target instead of detaching the element.
- [Embedded images inflate JSON through base64] -> Check the complete serialized candidate before
  commit and retain the existing transfer ceiling rather than silently degrading image quality.
- [The State change rejects existing exports] -> Update all fixtures, docs, and tests atomically;
  follow the explicit current-schema policy and provide no runtime fallback.

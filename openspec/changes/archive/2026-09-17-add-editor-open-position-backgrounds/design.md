## Context

Open positions are strict View-local records rendered through the shared Employee/open-position row
layout. They already participate in history, cloning, Unit clipboard operations, anchors, SQLite or
BroadcastChannel state, and full/scoped Editor PNG. The row now has a geometry-neutral dashed
outline, while its surface is always transparent except for transient selection and drop feedback.

The existing `EmployeeTagColor` contract, `TagColorPicker`, tonal DOM surfaces, and Canvas color
resolver already provide bundled named and custom colors without network access. The public State
parser is exact-key and current-only, so adding a persistent field replaces the previous open-
position shape and requires an offline owned-database readiness step rather than a runtime reader.

## Goals / Non-Goals

**Goals:**

- Let users choose a named or custom open-position background, or explicitly choose no background,
  in both create and edit workflows.
- Preserve the value through every complete-State and View-local operation with one undoable create
  or edit command.
- Keep DOM and full/scoped PNG presentation aligned without changing shared row geometry or the
  vacancy outline.
- Reject malformed, missing, or extra State fields atomically and safely prepare an owned previous-
  shape SQLite snapshot before publication.

**Non-Goals:**

- Coloring Employee rows, transferring vacancy colors to replacement Employees, adding opacity or
  per-theme controls, changing the global Tag catalog, or introducing remote palettes.
- Changing row ordering, sizes, anchors, hit testing, virtualization, collapse, replacement, or
  Employee-oriented exports.

## Decisions

### Persist one required nullable color

`OrgEditorOpenPosition` gains `backgroundColor: EmployeeTagColor | null`. `null` is the explicit
transparent state and the default for new positions. Reusing the established color type supports
the existing eight named tones and validated lowercase six/eight-digit custom hex values without a
new palette or dependency. A separate boolean plus color was rejected because it creates invalid
combinations; an optional key was rejected because exact State must have one current shape.

The strict parser accepts exactly `backgroundColor`, `id`, `tags`, and `title`, validates non-null
values with the existing canvas/tag color predicate, and rejects the previous shape. Store create
and edit inputs carry the nullable value, while clone and clipboard mapping copy it verbatim and
only regenerate IDs.

### Reuse the existing color picker and tonal resolver

The open-position dialog owns a transient nullable background draft and renders the existing field-
variant `TagColorPicker` with no-color enabled. Cancel changes no state; Save passes title, Tags, and
background into the existing single Editor history command. Existing localized `Background color`
and `No background` messages are reused, so the six catalogs do not gain redundant copy.

The live row applies the existing tonal color surface only while a persistent background is present.
Selection and Employee-drop surfaces remain authoritative transient states; focus and hover retain
their existing feedback. The background class/style is applied to the existing row container, so no
wrapper, measurement, pointer, virtualization, or anchor geometry changes.

### Paint the persistent surface before the outline

A pure helper resolves a nullable position background to the light Canvas tonal fill or `null`. The
PNG painter fills the complete shared row surface bounds first, then strokes the existing inset
dashed vacancy outline and paints avatar, title, and Tags. This preserves the established row radius
and guarantees default transparent positions remain pixel-equivalent apart from other intended
fixture changes. Transient selection, hover, focus, and drop styling stays excluded.

### Convert an owned previous-shape database only offline

After the new production parser exists, delivery inspects the configured owned SQLite state. If it
contains the immediately previous valid shape, the runtime is stopped, the database family receives
an ignored timestamped backup, and a temporary external converter adds
`backgroundColor: null` to every open position. The detached candidate is validated with the
production parser before one revision-incrementing transaction, and the committed row plus normal
startup are validated afterward. Any unexpected shape or failed preservation check aborts without
changing the authoritative row. No converter or database artifact is committed.

## Risks / Trade-offs

- **A tonal background could obscure transient feedback** → omit the persistent surface classes
  while selected or targeted for an Employee drop, preserving the existing primary/signal states.
- **DOM and PNG palettes could drift** → reuse the same established tonal color calculation and add
  helper-level plus browser/export assertions for named, custom, and null colors.
- **A State field addition can prevent startup on an older owned database** → perform the guarded
  stopped-runtime backup, detached conversion, production validation, atomic update, and startup
  proof before integration.
- **Large Views gain another value per position** → the field is read in O(1) during already-
  virtualized row rendering and adds no scan, index, subscription, or network work.

## Migration Plan

1. Update types, strict parser, current fixtures, stores, renderers, tests, docs, and capability specs.
2. Run the complete repository validation and deterministic gallery workflow.
3. Inspect the configured owned SQLite snapshot. Record absent/already-current, or perform the
   guarded offline previous-shape conversion described above and prove normal startup.
4. Synchronize and archive the OpenSpec change, merge, and publish. Rollback restores the timestamped
   database family and the preceding application commit together.

## Open Questions

None.

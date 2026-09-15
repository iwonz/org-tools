## Context

Canvas tools are durable View-local entities, but their interaction surface is currently split
between selection state in the Editor store and local active-tool/drag state in the canvas
component. A plain pointer-down on an already selected element can retain unrelated selected
elements, activating another creation tool does not clear the current selection, and context-menu
events bubble to the generic canvas menu. Rectangular elements expose four resize corners plus one
detached rotation handle, while the current bounds transform makes the affordance difficult to use.
The full-View Image dialog also duplicates a plain Employee format input and omits the established
footer icons.

The change remains inside the local browser/loopback trust boundary. It introduces no dependency,
network access, State field, compatibility reader, or migration.

## Goals / Non-Goals

**Goals:**

- Make one plain element click produce one unambiguous selection and make modifier selection remain
  explicit.
- Make creation-tool activation clear the current Unit/Employee/element selection before the next
  canvas gesture.
- Route right-click by canvas target and expose element layer, ordering, duplicate, and delete
  commands.
- Provide usable resize handles on every side and corner and rotation targets at every corner,
  transforming around the geometric center of the selected bounds.
- Keep the contextual property surface compact, readable, and responsive.
- Reuse the shared token-aware Format input and established footer icon treatment in full-View Image
  export.

**Non-Goals:**

- Changing canvas element persistence, attachment semantics, rendering order, or PNG composition.
- Adding element kinds, remote images, new fonts, or new export formats.
- Changing the scoped Unit Image export workflow beyond shared reusable input behavior.

## Decisions

1. **Selection and active-tool transitions use one explicit controller path.** A plain element
   pointer-down replaces selection with that element; Ctrl/Cmd toggles it. Selecting a creation tool
   clears durable selection and transient text/context state before changing `activeCanvasTool`.
   The Image picker follows the same transition before opening. This keeps store selection as the
   only persistent selection source while tool choice remains transient UI state. Preserving a
   multi-selection on an unmodified click was considered, but it is the current source of ambiguous
   highlighting and conflicts with the requested interaction.

2. **Context-menu targets are discriminated.** `OrgEditorContextMenu` gains an `element` variant,
   and canvas element nodes stop propagation and report their ID. Right-click selects the target if
   it is not already part of the element selection, then the menu applies plane/order, duplicate,
   and delete commands to the resulting selected element set. Reusing the generic canvas or Unit
   menu was rejected because those actions operate on different domain entities.

3. **Perimeter transforms share one geometry descriptor.** Rectangular and group frames render
   eight resize handles (`top`, `right`, `bottom`, `left`, and four corners) and four rotation hit
   targets adjacent to the corners; the detached top-center rotation point is removed. Resize
   geometry derives the opposite edge/corner, constrains the corresponding axis for side handles,
   honors Image aspect lock, and clamps minimum dimensions. Rotation always measures pointer angle
   around `bounds.x + width / 2`, `bounds.y + height / 2`; the same center drives single and group
   transforms. Pointer previews remain transient and commit one existing history command.

4. **The property surface is a compact responsive grid.** Shared property groups use bounded
   controls, icon-only actions with accessible names/tooltips, and wrapping group containers instead
   of one undifferentiated row. The tool row and View Image action remain in one surface with normal
   spacing and no decorative divider. No property is removed.

5. **Full-View Employee format reuses `TemplateFormatInput`.** The dialog derives the same supported
   Image Employee and Unit token descriptions used by Editor export, excludes `avatarBase64Url`,
   and adds `isBoss`. The shared help content documents both `@` discovery and the already supported
   conditional form such as `{isBoss ? '…' : ''}`; suggestion insertion continues to emit the
   existing `{token}` syntax, so the renderer and `?` parser remain unchanged. Copy and Save use the
   same bundled outline clipboard/download icons as scoped Editor export.

## Risks / Trade-offs

- **[Dense transform targets overlap at low zoom]** → Keep hit areas screen-legible through the
  existing scaled world layer and separate resize versus corner-rotation targets with documented
  data attributes for browser tests.
- **[Side resizing a rotated element can drift]** → Resolve pointer deltas in the selected bounds'
  local axes and verify the fixed opposite side plus center-based rotation in pure geometry tests.
- **[Property controls can still exceed narrow viewports]** → Bound the surface to the viewport,
  wrap semantic groups, and allow internal horizontal overflow only as a final narrow-screen guard.
- **[Right-click changes selection unexpectedly]** → Preserve an existing selected element group;
  only replace selection when the right-click target is outside that group.
- **[New guidance becomes untranslated]** → Add the same key and placeholders to all six catalogs
  and retain the catalog-completeness tests.

## Migration Plan

No State migration is required. Delivery replaces only interaction and presentation code. Rollback
is a code rollback; persisted canvas elements remain valid because their schema and semantics do not
change.

## Open Questions

None.

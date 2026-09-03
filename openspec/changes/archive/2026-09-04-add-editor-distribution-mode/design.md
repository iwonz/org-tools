## Context

The Editor already persists per-View selection and viewport separately from each structural
document, materializes current Live membership, virtualizes Employee rows, and paints hierarchy
connections inside the LTR canvas transform. Distribution mode is a diagnostic overlay over those
existing facts: it must survive reload, remain isolated by View, and update when membership changes
without becoming a Unit property or a report field.

## Goals / Non-Goals

**Goals:**

- Persist independent mode toggles for multiple Units in every View as bounded UI state.
- Derive direct current membership once and provide constant-time row status plus bounded selected
  Employee connections.
- Keep row and connection geometry deterministic across virtualization, collapsed Units, themes,
  locales, server mode, and Pages.
- Preserve structural history, Unit timestamps, canvas dimensions, output, privacy, and drag
  behavior.

**Non-Goals:**

- Do not infer membership from ancestors or descendants.
- Do not modify assignments, auto-distribute Employees, add a legend, or export the overlay.
- Do not carry a mode toggle with cross-View Unit clipboard Paste.
- Do not add runtime compatibility parsing or schema versions.

## Decisions

1. **Store enabled Unit IDs in `OrgToolsViewUiState`.** Each View UI entry gains the required unique
   `distributionModeUnitIds` array. `OrgEditorStore` owns the observable list and a validated toggle;
   OrgStore's existing UI reaction observes it. Toggle changes therefore use bounded UI persistence
   and BroadcastChannel synchronization without a document command. View clone remaps enabled IDs
   through the same Unit-ID map; blank Views and pasted Units start disabled. Deletion prunes IDs.

2. **Index resolved direct membership independently of selection.** Build one
   `Map<EmployeeId, UnitId[]>` from active View Units after replacing Live membership with its
   current resolved Employee IDs. Recompute only when that materialized Unit collection changes.
   Highlight lookup is O(1) per rendered source row. A line request reads only the selected
   Employee's indexed Unit list; parent/child containment alone never counts.

3. **Use semantic green and amber tonal tokens.** Add light/dark CSS variables for assigned and
   source-only states. Rows in an enabled Unit keep their status fill during hover. Selection uses a
   signal ring over that fill instead of the ordinary primary fill. A localized accessible status
   reports the number of other Units so color is not the only conveyed information.

4. **Derive line anchors from pure row geometry.** Expanded target Employees use the existing
   ordered row layout even when their DOM row is virtualized. When a collapsed target hides the
   Employee, the destination is the nearest edge of the Unit bounds with a small endpoint marker.
   For each source/target rectangle, choose the axis with the larger center delta, anchor opposing
   edges, and use a deterministic cubic path through their midpoint. A separate pointer-inert SVG
   layer paints green paths above hierarchy lines and below Unit cards. It neither participates in
   spatial indexing nor changes bounds.

5. **Gate connections by an exact selected occurrence.** Connections exist only when selection is
   exactly one `{ type: "employee", unitId, employeeId }` and `unitId` is enabled. Any additional
   selected item hides every distribution path while persistent row highlights remain. Toggling the
   mode does not clear selection.

6. **Replace the strict UI contract offline.** Blank state and all fixtures include empty arrays.
   Complete State validation requires unique IDs belonging to the corresponding View. With the
   server stopped, a guarded converter backs up the SQLite file family, adds the arrays to `ui_json`,
   preserves organization and timestamps, increments revision once, and validates with production
   parsing. No converter remains in runtime code.

## Risks / Trade-offs

- **Very high Employee fan-out could create many paths.** Paint only the selected Employee's direct
  membership list and cull path bounds against the visible world; never scan all Units on selection.
- **Status and selection fills could obscure each other.** Preserve the green/amber fill and express
  selection with the existing signal ring plus focus treatment.
- **A collapsed target has no row anchor.** Use a documented Unit-edge fallback rather than silently
  hiding the relationship or mutating collapsed state.
- **Strict State files become incompatible.** Convert only the configured local database offline;
  reject former files atomically as required by the current-only contract.

## Migration Plan

1. Stop the local server and resolve the configured SQLite path.
2. Copy the database and any sidecars to timestamped backup names.
3. In one transaction, add empty `distributionModeUnitIds` arrays to every View UI entry and
   increment revision once without changing organization JSON or timestamps.
4. Validate the resulting complete state through the production parser and reopen it through the
   normal runtime.
5. Restore the backup file family if conversion or validation fails.

## Open Questions

None. Product choices for persistence, multiple enabled Units, colors, Live membership, and
collapsed destinations are resolved.

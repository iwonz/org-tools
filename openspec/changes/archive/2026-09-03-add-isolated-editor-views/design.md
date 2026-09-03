## Context

The current strict state owns one Unit structure and one `OrgEditorStore`. Units, Editor, Analytics,
Employee Team assignment, Employee Import, Data Download, and Editor export all derive from it.
Employees, custom fields, and Tags are already normalized global catalogs. An older View
implementation existed, but it copied or overrode Employees inside custom Views; that model must not
return because Employee identity and Tag changes now need to remain central.

The change must preserve automatic scoped persistence, memory-only Pages behavior, the 20,000
Employee / 4,000 Unit target, adaptive-grid gesture performance, six locales, and current-only public
state policy. The owned SQLite row contains the only local organization and must be converted without
losing its current structure.

## Goals / Non-Goals

**Goals:**

- Store one protected system View and isolated custom structural documents over one global Employee,
  custom-field, and Tag catalog.
- Make the system View the single source used by Units and Analytics while allowing Editor and Data
  Download to select the appropriate View.
- Clone, rename, and delete custom Views without dangling Unit, Employee, Live-rule, UI, or Download
  references.
- Add a direct-membership Tag summary whose layout is identical in canvas geometry and PNG output.
- Keep inactive View derivation and UI persistence bounded.

**Non-Goals:**

- View-local Employee copies, profile overrides, permissions, collaboration, sharing, history across
  reloads, backups in the public format, or remote persistence.
- Runtime migration, legacy state import, duplicate system structures, Analytics source selection,
  or custom Views in the Units destination.
- Changing the SQLite table, state API route shape, Employee identity algorithm, or Tag color model.

## Decisions

### Views own structural documents; catalogs remain global

`organization.views` is a strict discriminated array. Exactly one `{ kind: "system", name: null }`
View exists; custom Views have normalized unique names. Each View owns `{ layoutMode, units }` and
timestamps. Unit IDs are unique across the complete array so existing selection, export, geometry,
and membership helpers remain unambiguous. `ui.editor` owns `activeViewId` plus one bounded
`{ viewId, selectedItems, viewport }` entry for every View.

The system View's name is derived from the localized Units label rather than persisted. Units and
Editor receive the same system `OrgEditorStore`, so their edits cannot diverge. Each custom View has
its own editor store, undo/redo stacks, clipboard, selection, and viewport. Employee profile, custom
value, and Tag mutations update the global catalog; every derived View resolves those current values.
Removing an Employee row changes only the active View membership, while global deletion purges all
View references.

Alternative: keep `organization.structure` plus `customViews`. Rejected because two structural
storage shapes complicate validation, lifecycle, and generic source selection. Alternative: copy
Employees into each View. Rejected because it creates identity divergence and contradicts central
Employee editing.

### Copy remaps the complete structural reference graph

Creating a copy uses any existing View. It clones Unit structure, memberships, positions, bosses,
Live rules, collapse state, layout, geometry, and viewport, but creates new View and Unit UUIDs,
remaps parent and Live-rule Unit references, and clears selection, history, and clipboard. A blank
View uses the default editor state. Names are 1–100 characters and unique after NFKC normalization,
trim, whitespace collapse, and case folding. Delete and rename are unavailable for the system View.

Deleting a custom View falls back to the system View wherever it was active. Data Download source
selection, source filters, selected Employees/Units, Employee exclusions, and Unit exclusions reset;
format, field names/order, Template settings, and global Tag exclusions remain.

### Derived structures are lazy and source-specific

A View registry owns document revision counters and editor stores. Derived `UiOrgStructure` values
are cached by View revision plus global catalog revision and built only for the system View, active
Editor View, and selected Download View. Global catalog changes invalidate cache keys without eagerly
materializing every custom View. Live rules resolve against manual membership in their own View.

Analytics continues to use the system derived structure and its existing Employee population
semantics. Data Download exposes an independent source Select, lists only Employees assigned in that
View, and resets source-specific selection on change. Editor Image/JSON/Template export uses the
active View. Employee-array Team Import and global Employee Team editing target only the system View.

### Direct Tag summaries participate in layout

Each built View derives, in one membership pass, ordered Tag counts for the direct resolved Employee
IDs of every Unit. Counts are unique per Employee and Tag and ignore assignment dates and descendants.
An expanded Unit with a nonempty summary renders a borderless tonal footer after the Employee list.
All catalog-ordered filled Tag chips wrap. Shared measurement constants calculate the footer rows and
height; Unit bounds, spatial buckets, connections, overlap avoidance, virtualization, and PNG drawing
consume that same height. Collapsed or tagless Units have no footer.

Tag catalog rows retain zero row padding and no hover surface, but their list container gains a
vertical gap so actions remain visually separable.

### The strict state changes once

The parser accepts only the new View array and per-View UI projection. Full State Import/Export and
BroadcastChannel use that exact contract; old single-structure files fail atomically. The SQLite
schema remains the exact singleton `application_state` table.

With the server stopped, a one-off repository script backs up the database and sidecars, wraps the
current structure in a new system View, creates its UI record from the current Editor viewport and
selection, points Download at it, validates with the new production parser, and updates the JSON row
in one transaction. It preserves organization content and `created_at`, advances revision once, and
is removed after successful conversion. Failure rolls back and leaves the source files available.

## Risks / Trade-offs

- **Many large Views increase state size and organization-save cost** → derive inactive Views lazily,
  keep UI writes scoped, and preserve one serialized organization snapshot per structural command.
- **Global Employee mutations invalidate several visible sources** → revision-key caches rebuild only
  the at-most-three currently consumed Views.
- **Wrapped Tag summaries increase Unit heights** → one shared measurement path drives canvas and PNG
  geometry, and geometry indexes rebuild only after membership, Tag, or Unit-bound changes.
- **View deletion can strand Download or UI references** → perform reference cleanup and fallback in
  the same MobX action before strict validation and persistence.
- **The state change rejects existing exports** → intentionally enforce the current-only policy while
  converting the owned SQLite snapshot once with a verified backup.

## Migration Plan

1. Stop the local runtime, record state revision and semantic Employee/Unit/Tag fingerprints, and
   create an ignored timestamped SQLite backup including sidecars.
2. Run the one-off converter in a transaction, creating one system View and remapping durable UI and
   Download source references without changing Unit or Employee IDs.
3. Validate the resulting JSON with the production parser and compare catalog, Unit, membership,
   Tag, custom-field, and timestamp invariants; roll back on any mismatch.
4. Remove the converter, start the new runtime, verify automatic persistence and reload, and retain
   the ignored backup for manual recovery.

## Open Questions

None. The approved plan fixes system naming, deletion scope, copy behavior, Download source behavior,
strict compatibility policy, Analytics scope, and wrapped Tag footer behavior.

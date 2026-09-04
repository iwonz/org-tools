## Context

The active Editor already stores distribution-enabled Unit IDs per View and maintains a memoized
direct membership index for manual and resolved Live Units. The Unit context menu already receives
the complete selected Unit set, and Editor search already knows how to reveal, center, and select an
Employee occurrence. Shared Employee filters virtualize Tag rows but do not search or sort them,
while the Tag catalog places counts below each Tag.

## Goals / Non-Goals

**Goals:**

- Apply distribution mode to a selected Unit set with one bounded UI mutation.
- Reuse direct membership indexes for a discoverable multi-Unit Employee action and local placement
  map.
- Make shared Tag filters searchable, locale-aware, virtualized, and efficient for bulk selection.
- Keep Tag catalog metadata dense and horizontally aligned.

**Non-Goals:**

- Changing `OrgToolsState`, SQLite, Import/Export, or runtime APIs.
- Editing Unit structure inside the placement map.
- Treating hierarchy descendants as direct Employee placements.
- Persisting filter queries or placement-map viewport.

## Decisions

### Distribution updates use one tri-state set operation

The menu derives `all`, `none`, or `mixed` from the selected Unit IDs. An `all` activation removes
the entire selected set; `none` and `mixed` add the entire selected set. The store receives one
deduplicated final array, so observers produce one bounded UI write and no organization history.
Separate enable/disable commands were rejected because they add menu height and require the user to
reason about the current selection twice.

### Placement inspection reuses the active-View membership index

Every eligible Employee occurrence gets a sibling icon button outside the row's main drag/select
button. The modal receives only the selected Employee ID and derives current Unit IDs from the
existing index. A deterministic concentric layout produces a central Employee node, Unit nodes, and
SVG links. Pan, zoom, Fit, and Reset are transient. Navigating delegates to one shared
`focusEmployeeOccurrence` callback also used by Editor search, which expands the Unit, centers the
exact row at the current scale, and applies existing selection styling.

### Tag discovery uses one locale-aware derived option list

The shared filter creates sorted Tag options with `Intl.Collator(activeLocale, { numeric: true,
sensitivity: "base" })`, normalized search text, and stable ID tie-breaking. A deferred transient
query filters that memoized list without affecting selection. Select all adds only visible IDs and
Deselect all removes only visible IDs; selections outside the query and Without tags remain intact.
The Tag catalog uses the same comparison helper so both surfaces agree.

### Tag catalog counters remain fixed beside the Tag

The identity area is a single min-width-aware flex row: a truncatable Tag surface followed by two
non-wrapping muted count labels at equal gaps. Existing row actions remain at the logical end. This
keeps metadata aligned without restoring card padding, border, fill, or hover chrome.

## Risks / Trade-offs

- **Large membership sets could produce a dense map** → use multiple deterministic rings, collision
  spacing, fit-to-view, and bounded pan/zoom rather than reusing full Editor geometry.
- **The row action could interfere with drag** → render a sibling button, reserve a fixed end slot,
  and stop pointer, click, and context-menu propagation.
- **Locale changes could reorder open lists** → derive order from the active locale and stable ID
  tie-breaking; selection remains ID-based.
- **Live membership may change while the modal is open** → rederive nodes from current state and
  close safely when the Employee is removed or has fewer than two placements.

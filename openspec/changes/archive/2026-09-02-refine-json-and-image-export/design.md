## Context

Data Download persists three independent JSON order arrays, but its UI renders Employee fields in
one panel and Unit/Tag collections in separate panels. The formatter consequently hard-codes all
scalar fields before both collections. Editor export reuses the JSON settings component, but
duplicates Template row-mode UI and maintains a second full-image dialog on top of the bounded inline
preview. The strict current-only state contract and an existing local SQLite row require a deliberate
one-time projection rewrite when the Download shape changes.

## Goals / Non-Goals

**Goals:**

- Make the final top-level JSON key order directly sortable in both export surfaces.
- Present scalar fields, Units, and Tags as one visual list while keeping nested collection fields,
  names, parent selection, and exclusions manageable.
- Share the Template row-mode control and preserve bounded, local output generation.
- Simplify Editor Image controls without reducing copy/download or customization capability.
- Keep keyboard/accessibility names for drag handles, icon-only alignment, and scope controls.

**Non-Goals:**

- Adding another export format, remote storage, automatic file opening, or external preview viewer.
- Persisting Editor export session settings.
- Changing Employee, Unit, Import, SQLite table, or API schemas beyond the bounded Download UI JSON.
- Reading or migrating obsolete exported state documents at runtime.

## Decisions

### One explicit top-level JSON order

Replace `employeeFieldOrder` with `jsonTopLevelFieldOrder`, whose values are every scalar Employee
key plus `units` and `tags` exactly once. Selection remains represented by the existing scalar and
nested selected-key arrays. The formatter walks the unified order and emits a scalar or enabled
collection at each position. Nested Unit and Tag orders remain explicit and sortable.

This is preferable to deriving collection positions from DOM state because order remains strict,
serializable, testable, and identical between Data Download and the Editor session. The parser
requires the new exact array and rejects the obsolete projection.

### Shared sortable settings composition

`StructuredJsonSettings` owns native drag/drop state and a small generic reorder helper. Every
top-level item uses one row geometry with a leading drag handle, checkbox, label, output-name input,
and reset action. Unit and Tag rows reveal indented, unboxed nested rows and exclusions only when
enabled. Nested rows use the same handle behavior within their collection. Drop samples only change
local UI order; output is rebuilt through the existing bounded preview path.

Native drag/drop avoids a new dependency and supports Playwright verification. Handles retain
localized accessible labels and do not alter row dimensions while dragging.

### Shared Template row-mode control

Extract the current two-option card control into one component receiving value, counts, and change
callback. Data Download and Editor Template export both render that component, so labels, selection,
counts, and responsive geometry cannot diverge.

### Reduced Editor Image surface

Keep the inline bounded image preview but remove its visible Preview heading, Open action, object-URL
zoom state, and expanded dialog. Title alignment becomes a compact icon-only three-option control in
the same Title/Size row, with localized `aria-label` and title text. Scope tabs receive leading
subtree and Unit icons. The Image Employee token list always excludes `avatarBase64Url`; avatars
remain painted by the card renderer independently of text format.

The default boss label is provided from the active message catalog when
the Image session is initialized rather than embedding localized text in source. Preview labels are
hidden only in Editor export; Data Download retains its existing preview heading.

### Current database rewrite

With the server stopped, rewrite only `ui.download` in the configured local SQLite row: replace the
old scalar order with a unified order by appending `units` and `tags` after the prior scalar order,
preserve every other setting and organization byte-for-byte, and increment revision once. Validate a
temporary copy and the rewritten row with the production parser. No compatibility branch or schema
version is added.

## Risks / Trade-offs

- **Native drag/drop is primarily pointer-oriented** → retain visible handles and expose deterministic
  store reorder functions covered by unit tests; do not hide field selection behind dragging.
- **A disabled collection still needs a stable position** → keep both collection keys in the unified
  order while omitting disabled collections from generated JSON.
- **Locale changes after opening Image export could leave the existing draft label unchanged** →
  initialize on each modal session and treat subsequent user edits as authoritative.
- **Strict state change invalidates old exports** → document the break, update every fixture, and
  transactionally rewrite only the stopped local database UI projection.
- **Preview regeneration during repeated drops could be wasteful** → commit one reorder per drop and
  retain the current 50-record/128-KiB bounded preview.

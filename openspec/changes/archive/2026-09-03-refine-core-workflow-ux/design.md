## Context

Org Tools shares one strict state model between a loopback SQLite-backed Next.js runtime and a
browser-only Pages runtime. Several high-frequency workflows currently duplicate controls or render
large collections in layouts that are difficult to scan. The server startup error is also a dead
end: retrying is possible, but replacing an unusable database requires manual filesystem work.

The change crosses the state repository, same-origin API, runtime controller, export formatter,
Employee transfer pipeline, virtualized Calendar dialogs, Employee draft form, localization,
documentation, and screenshot tooling. It must preserve the public `OrgToolsState`, the current
SQLite schema, the `{token}` template language, local-only privacy, and the 20,000 Employee / 4,000
Unit performance target.

## Goals / Non-Goals

**Goals:**

- Make explicit database recovery safe, reversible, and available from both blocking startup error
  states.
- Provide one keyboard-accessible Format input for both Template export workflows.
- Make Download, Unit search, and Employee mapping geometrically stable and easy to understand.
- Reuse ordinary Employee cards and shared controls in Calendar and Employee forms.
- Bound parsing, preview, and rendering work for large imports and event collections.
- Keep English and Russian behavior, documentation, specifications, tests, and screenshots aligned.

**Non-Goals:**

- Changing the public state, database schema, Employee identity, or stored Template syntax.
- Adding migration, compatibility, remote recovery, automatic destructive reset, or a Pages API.
- Persisting transient suggestion menus, Import candidates, unfinished Employee drafts, or Calendar
  dialogs.
- Replacing the existing Template expression parser or changing output semantics.

## Decisions

### Database recreation is a repository-level transactional filesystem operation

`POST /api/state` accepts only the exact JSON body `{ "action": "create_new" }` after the same
loopback Host, same-origin Origin, and JSON checks used by other mutations. The repository closes
the process-level connection before touching files. It renames the configured database and each
existing rollback/WAL sidecar to one timestamped backup family, creates the exact current schema at
the same configured path, and validates the new state through the production reader.

If any rename or creation step fails, the repository closes and removes only the partial files it
created, restores every moved original, and reopens the original database when possible. The API
returns a stable localized error code rather than a filesystem message. This keeps recovery
explicit and preserves evidence for manual repair. Copying files was rejected because it can leave
the active corrupt database in place and doubles large files unnecessarily. Deleting the old files
was rejected because it makes an accidental reset irreversible.

### Template suggestions are an editor affordance over the unchanged parser

`TemplateFormatInput` owns a textarea and transient suggestion state. It detects the active
`@query` immediately before the caret, filters a provided token catalog by key and localized
description, and inserts the existing `{token}` representation. The dropdown is positioned from a
textarea mirror measurement and remains a standard bordered floating surface. Selection and menu
state are local; the parent continues to own only the format string.

Keyboard handling is explicit: arrows change the active option, Enter inserts, Escape and Tab
close, the first Backspace while open only dismisses, and whitespace terminates the query without
rewriting it. Manual braces and conditionals never pass through a compatibility transform. A rich
text or contenteditable implementation was rejected because it would complicate caret behavior,
accessibility, paste, and exact plain-text serialization.

### Download geometry uses two stable peers

The source selector/list and selected-Employee summary/list are rendered as two equal grid columns.
Each column has a fixed control row and aligned search row, so switching Units and Employees changes
content rather than shell geometry. Below 768 px the same peers become two equal-height rows. Unit
search is always rendered. The contextual header action gains a bounded `iconPlacement` option;
only Continue uses the trailing placement.

### Employee Import analysis produces one immutable source descriptor

Parsing performs one linear pass over all rows to collect mappable paths and score each row by its
available path count. The first maximum-scoring row becomes the representative sample. Its pretty
JSON is UTF-8 bounded to 128 KiB and carries an explicit truncation flag. Mapping rows present one
source-path Select, an arrow, and one fixed Org Tools target. Tags and Teams are ordinary targets;
the presence of a Teams mapping alone enables Team import and Teams-only duplicate policies.

This descriptor is computed once when a file is read, not during render or mapping changes. The
existing indexed identity matching, sparse per-row overrides, and virtualized review remain. Showing
many samples was rejected because it obscures mapping and scales preview work with the row count.

### Calendar day details use one virtualized mixed row stream

The selected day is flattened into section-header and Employee-card rows. A nonempty Birthday
section comes first, followed by normalized tag groups sorted through the active locale. Employees
within each section use stable name ordering, and an Employee may occur in multiple tag sections.
Interactive tag headers open the existing tag history. One scroll owner and one virtualizer avoid
nested scrolling and keep full standard Employee cards bounded for large event days.

### Employee form controls edit draft state only

Gender uses native radio inputs inside one segmented group. Birthday keeps three independent Select
values inside one shared bordered compound control. Tags reuse the virtualized picker behavior but
operate through a draft `EmployeeTag[]` adapter; selected chips remain inside the wrapping trigger
and no organizational mutation occurs before the form's Save action. Existing quick-tag workflows
retain their immediate adapter. This separates picker presentation from persistence semantics.

## Risks / Trade-offs

- [A process crashes between database renames] → Use a deterministic timestamped backup family,
  move sidecars with the main file, and document that backups are retained for manual recovery.
- [Filesystem rollback itself fails] → Return a stable blocking error, retain all surviving backup
  paths, and never silently initialize another path or in-memory database.
- [Caret coordinates vary across browsers] → Mirror the textarea typography and scrolling, clamp
  the popup to the input bounds, and cover insertion plus keyboard behavior in browser tests.
- [A heterogeneous import contains rare paths after the representative row] → Collect the global
  path union from every row while choosing the richest single record for display.
- [Full Employee cards make a busy Calendar day tall] → Use one variable-size virtualizer and one
  scroll surface rather than truncating identity, assignments, tags, or actions.
- [A tag picker trigger can become tall] → Allow all chips to wrap, keep the dialog scrollable, and
  avoid hidden `+N` summaries so the draft remains auditable.

## Migration Plan

No public state or SQLite schema migration is required. The feature ships as UI, API, and repository
behavior over the current strict contracts. Existing databases remain untouched until a user
explicitly confirms Create new. On confirmation, the old database family remains available as a
timestamped backup; restoring it requires stopping Org Tools and replacing the newly created files.
The Pages build excludes the recovery route and server repository by its existing module boundary.

## Open Questions

None. The recovery behavior, narrow Download layout, representative Import record, and draft Tag
picker interaction are fixed by the approved plan.

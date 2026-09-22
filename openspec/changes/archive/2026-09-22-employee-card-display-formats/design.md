## Context

Employee list cards, Unit cards, Editor rows, and Editor PNG rows currently assemble identity,
assignments, and Tags independently. The existing template language already provides token
suggestions and deterministic value formatting, but presentation formats are transient or embedded
in component markup. The strict unversioned State has no Employee presentation settings.

The change must preserve local-only data flow, safe explicit navigation, virtualized lists, Editor
row hit testing and anchors, PNG geometry, six locale catalogs, and the fixed screenshot gallery.

## Goals / Non-Goals

**Goals:**

- Persist four organization-wide Employee card formats and edit them with live previews.
- Resolve one Unit context where one exists and all ordered system assignments elsewhere.
- Share formatted lines and deterministic Editor geometry between DOM and PNG consumers.
- Keep explicit image-export changes as transient overrides.
- Replace the exact State shape and convert the owned SQLite snapshot once offline.

**Non-Goals:**

- Add template loops, style markup, remote assets, runtime compatibility, or a State version.
- Change open-position cards, Unit Tag footers, Employee filters, or Employee data semantics.

## Decisions

### Persist one exact organization object

`organization.employeeDisplayFormats` contains exact `employees`, `units`, `editor`, and
`editorExport` string keys. Organization state, rather than UI state or View documents, owns the
formats because the Employee catalog is global. One store action commits all four values and causes
one organization persistence/broadcast event.

### Reuse the template grammar through a shared display resolver

A shared renderer resolves built-in Employee fields, custom fields, Tags, and Unit fields, then
returns normalized non-empty lines. Contextual cards resolve one Unit assignment. Employees and
fallback cards resolve Unit fields as ordered arrays from the system View. The same textual result
feeds list cards, Editor DOM, previews, and PNG; list surfaces may decorate recognized safe fields
with existing explicit links without changing their text.

Keeping formats as plain strings preserves the existing `@`, token, conditional, and deterministic
array behavior. Empty formats are valid. Horizontal overflow is truncated; the first line is primary
and later lines are secondary.

### Make Editor line geometry deterministic

Employee Editor rows derive height from formatted line count with the current row height as the
minimum. A shared layout helper supplies row height, line baselines, and text width to DOM geometry,
hit testing, anchors, Unit bounds, and PNG painting. Open positions keep their existing title and Tag
layout. Separate Editor and Editor-export formats can intentionally differ, and explicit PNG dialog
settings remain allowed overrides.

### Preserve token dependencies

Custom field key rename rewrites parsed references in every persisted display format. Field deletion
checks those four formats before any mutation, matching existing Template and export dependencies.

### Preview drafts before one commit

The Display tab owns a local four-format draft. Previews update from the draft, Save commits all
values, and dismissing the dialog discards unsaved edits. Real organization Employees and contexts
are preferred; a bounded synthetic local record covers the empty state without entering State.

## Risks / Trade-offs

- [Long or multiline formats increase card height] → keep horizontal truncation, a fixed minimum row
  height, existing virtualization, and one O(n) prefix-layout pass for Editor rows.
- [Custom-field evaluation can be repeated across surfaces] → reuse the existing dependency-ordered
  evaluator and derived Employee/Unit indexes; do not scan the catalog from individual cards.
- [Separate DOM and PNG formats can look different] → share line normalization and geometry while
  testing both persisted defaults and transient image overrides.
- [Exact State replacement makes existing data unreadable] → stop the owned runtime, retain an
  ignored database-family backup, convert a detached candidate, validate with the production parser,
  commit once, validate again, and prove normal startup. Runtime remains strict.

## Migration Plan

1. Inspect and stop the configured owned runtime, then copy the settled SQLite database family to a
   timestamped ignored backup.
2. Create a detached candidate whose organization JSON adds the four default formats without
   changing any prior value; validate it with the built production parser and compare preservation
   hashes.
3. Commit the converted row in one local transaction, parse the committed State, and start the
   ordinary runtime. Keep the converter and database artifacts outside Git.
4. Roll back by restoring the retained database family before publication if any validation or
   startup check fails.

## Open Questions

None.

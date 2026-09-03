## Context

Org Tools currently stores Employee identity in the identifier itself, repeats Tag labels inside
every Employee, and builds filters and exports from a fixed field registry. The change replaces
those assumptions across the strict state parser, MobX stores, Import, output, Calendar, both
runtimes, fixtures, and the user's current ignored SQLite row. State remains unversioned and
current-only, organization data remains local, and the maintained scale remains 20,000 Employees
and 4,000 Units.

## Goals / Non-Goals

**Goals:**

- Give Employees stable UUID identity while detecting duplicate people independently.
- Normalize Tags into a color-aware catalog with reference-safe rename and delete behavior.
- Support typed stored and dependency-safe computed Employee fields everywhere they are useful.
- Keep Import, filters, export, Calendar, persistence, and tab synchronization strict and bounded.
- Convert the current local state once, with a backup and atomic rollback.

**Non-Goals:**

- Runtime schema migrations, compatibility aliases, old-file readers, remote storage, or telemetry.
- Custom fields on Units or Tags, formulas beyond the existing template language, or collaborative
  schema editing.
- Importing Tag colors through mapped Employee Import.

## Decisions

### Stable IDs and independent identity keys

New Employees receive UUID v4. Imported new Employees retain any canonical UUID, while an identity
match retains the existing UUID. Duplicate matching uses an indexed normalized tuple of first name,
last name, and email. Identity edits therefore validate uniqueness but never rewrite references.
Ambiguous input UUIDs or identity tuples block an atomic Import.

### Normalized definitions and values

`organization.employeeFieldDefinitions` stores tagged-union Template and Value definitions.
Employee values are keyed by definition UUID; option values are keyed by option UUID. Template
definitions store only format and hash choice. Tag definitions are stored once and Employee
assignments contain only Tag ID and optional date. Stable references make label, option, and field
renames inexpensive and safe.

Value types retain JSON-native booleans and finite numbers, canonical `DD.MM.YYYY` date strings,
text strings, and option IDs. Requiredness is enforced when an Employee form is saved, allowing a
new required definition to coexist temporarily with older incomplete Employees.

### One shared token graph

A registry combines built-in keys with custom definition keys. Token extraction builds a directed
graph across Template definitions; validation rejects cycles and the `@` menu excludes candidates
that would create one. Rendering memoizes results per Employee in topological order. Hashing uses a
small local implementation over UTF-8 and lowercase hexadecimal output, with no dependency or
network boundary. Renaming a key rewrites parsed token references rather than arbitrary text.

### Indexed filters and scalable review

Derived organization indexes own identity tuples, Tag definitions, typed custom values, computed
Template output, and distinct filter options. UI state stores custom filter selections by field ID
and typed stable value. The shared filter surface renders Unit, Tag, position, gender, complete
birthday, then custom fields. OR applies inside a filter and AND across filters.

Employee Import performs one indexed analysis and stores sparse policy overrides. Three independently
virtualized review columns derive from the cached candidate: new rows, non-skipped identity matches,
and skipped rows. Import-created Value definitions stay transient until the same atomic Apply that
adds or updates Employees.

### Locale-aware Calendar grid

Calendar creates a full week-aligned sequence with leading placeholders, Monday-first for Russian
and Sunday-first for English. Weekend metadata comes from the actual date rather than column index.
The header owns a horizontally scrollable Tag rail and fixed month navigation. Day cells retain
birthday avatars but summarize dated Tags with one icon and assignment count.

### Current local database conversion

Delivery stops the server, copies the database family to a timestamped ignored backup, parses the
current state with the old checked-out code, transforms all IDs and references in memory, validates
with the new parser, and writes organization and UI once in an immediate SQLite transaction. The
repository retains no compatibility code. Any failure rolls back the transaction and keeps the
backup available.

## Risks / Trade-offs

- [Breaking state files] → Reject them clearly and document the one current contract.
- [Template graphs can be expensive] → Validate once, topologically cache per organization change,
  and never recompute for UI-only actions.
- [Many distinct filter values] → Build indexed distinct options and virtualize every custom list.
- [Destructive definition changes] → Require confirmation, clear affected values atomically, and
  block deletion while references remain.
- [Database rewrite failure] → Stop the runtime, retain a timestamped backup, transact the write,
  validate before commit, and verify organization counts afterward.
- [Dense Calendar header] → Keep the Tag rail single-line and scrollable; stack it above fixed
  navigation only at narrow widths.

## Migration Plan

1. Build and test the new strict types and parser without opening the current server database.
2. Stop local Org Tools and create a timestamped backup of the database and sidecars.
3. Transform Employee and Tag IDs plus all organization/UI references, validate, and commit once.
4. Start the production build against the rewritten database and verify counts and revision.
5. Roll back by restoring the backup family if any verification fails.

## Open Questions

None.

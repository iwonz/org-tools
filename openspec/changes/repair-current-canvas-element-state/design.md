## Context

The configured singleton database has the exact current table shape and three valid pre-canvas View
documents. Each View lacks only `structure.canvasElements`, so the new strict parser rejects startup
with `corrupt_stored_state`. The public current-only contract and runtime rejection are intentional;
the missing delivery step is the repository's established guarded offline conversion of the owned
local snapshot.

The database contains user organization data and must not be printed, copied into the repository, or
sent outside the machine. The application may be running and SQLite sidecars may exist, so conversion
must happen only after owned processes stop.

## Goals / Non-Goals

**Goals:**

- Restore normal startup without losing or reinterpreting any organization or UI data.
- Preserve a recoverable timestamped copy of the complete database family.
- Prove the candidate and committed row pass the production parser.
- Make future strict State-shape delivery explicitly include the owned database readiness check.

**Non-Goals:**

- Do not add a runtime migration, compatibility parser, schema version, automatic reset, or import
  fallback.
- Do not modify public State files, Pages persistence, canvas semantics, or existing annotations.
- Do not retain a converter or database artifact in Git.

## Decisions

### Convert only the exact diagnosed previous shape

The offline operation accepts the current table and singleton row only when every View has the exact
previous structure keys and lacks `canvasElements`. It adds `canvasElements: []` and changes nothing
else in the organization or UI JSON. An already-current database is a no-op; any mixed or unexpected
shape aborts.

Alternative: make `canvasElements` optional in the production parser. Rejected because that creates
the compatibility reader explicitly excluded by the current-schema contract and would affect Import,
SQLite, and live peers indefinitely.

### Validate a detached candidate before touching the original

A temporary local database copy receives the transformation first and is opened through the current
production state repository/parser. Structural fingerprints compare both projections before and
after while ignoring only the inserted empty arrays and revision/update metadata. The original is
updated only after that proof succeeds.

Alternative: update JSON directly and rely on the next application launch. Rejected because a
second incompatibility would leave the user on the blocking screen after mutation.

### Preserve the database family and commit atomically

Owned development/server processes stop before inspection. The database and existing journal/WAL/SHM
sidecars are copied to timestamped ignored backup names. One `BEGIN IMMEDIATE` transaction replaces
`organization_json`, increments revision exactly once, and updates `updated_at`; `ui_json`,
`created_at`, and all organization timestamps stay byte-equivalent. The committed database is then
reopened and validated through the production parser.

Alternative: use the UI's Create new recovery. Rejected because it intentionally discards the active
state and is unnecessary for an exact, validated additive field repair.

### Turn the missed operation into a delivery invariant

AGENTS.md, architecture/usage documentation, and project-tooling requirements will state that a
strict State-shape change is not deliverable until the configured owned SQLite snapshot is either
already current or has been safely converted offline. This remains an operational delivery step,
not runtime code.

## Risks / Trade-offs

- [A process still owns SQLite] -> Stop checkout-scoped development instances and verify no matching
  process before backup or transaction.
- [The state differs from the diagnosed shape] -> Abort before mutation and retain the original.
- [Validation succeeds on the candidate but commit fails] -> Roll back the transaction; the original
  database-family backup remains available.
- [The new field could hide prior annotations] -> Only Views proven to predate canvas elements are
  accepted, so the correct semantic value is an empty array.

## Migration Plan

1. Record non-sensitive table, revision, View/count, timestamp, and canonical payload fingerprints.
2. Stop owned runtime processes and copy the full SQLite file family to a timestamped ignored backup.
3. Transform a detached copy, validate it with the production parser, and verify preservation
   fingerprints.
4. Apply the same JSON in one transaction to the configured database with one revision increment.
5. Reopen through the production parser and launch/probe the configured server.
6. On any failure, leave or restore the original family and report the retained backup path.

## Open Questions

None.

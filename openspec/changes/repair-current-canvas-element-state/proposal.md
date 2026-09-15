## Why

The canvas-tools release made `structure.canvasElements` mandatory but published without converting
the configured local SQLite snapshot. A valid pre-release organization therefore appears as
“Stored state is corrupt” at startup even though only the newly required empty collection is
missing.

## What Changes

- Repair the configured local SQLite state offline by adding an empty `canvasElements` array to
  every existing View that has the exact previous structure shape.
- Stop the owned runtime first, preserve a timestamped ignored database-family backup, validate the
  transformed candidate with the production parser, and update the singleton row in one transaction
  with one revision increment.
- Verify organization, View, Unit, Employee, assignment, Tag, custom-field, timestamp, and UI
  fingerprints remain unchanged apart from the required field and revision metadata.
- Keep runtime parsing strict: no migration, compatibility reader, automatic repair, reset, or
  browser persistence is added.
- Require future strict State-shape deliveries to inspect and, when necessary, convert the configured
  owned SQLite snapshot before publication so a successful release reopens normally.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `single-state-runtime`: define the guarded one-time canvas-element repair and its preservation and
  rollback guarantees.
- `project-tooling`: require strict State-shape delivery to validate and prepare the configured local
  snapshot before integration.

## Impact

The ignored configured SQLite database and a timestamped ignored backup are affected operationally.
Repository changes are limited to delivery policy, documentation, OpenSpec contracts, and tests or
checks needed to prevent another omitted offline conversion. Public State, API, Pages behavior,
runtime dependencies, and organization data semantics do not change.

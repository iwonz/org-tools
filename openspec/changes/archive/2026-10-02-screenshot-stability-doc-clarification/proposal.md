## Why

The validation guide retained one sentence from the previous screenshot-noise model and contradicted
the implemented comparator and canonical project-tooling requirement.

## What Changes

- Clarify that ordinary small-delta antialiasing and explicitly scoped raster noise have independent
  bounded allowances.
- Keep runtime behavior, validation policy, limits, and evidence unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: restate the current screenshot stability contract as the source for the corrected
  validation guide; normative behavior does not change.

## Impact

Only `docs/validation.md` changes. State, PostgreSQL, APIs, UI, localization, tests, and screenshot
output are unaffected.

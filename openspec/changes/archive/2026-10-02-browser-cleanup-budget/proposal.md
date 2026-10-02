## Why

The complete RBAC browser scenario can finish its assertions near the test deadline on a cold CI
runner. Its mandatory encrypted Backup restore then inherits almost no time, so Playwright can abort
cleanup, leave the server under maintenance, and turn the remaining shard into misleading failures.

## What Changes

- Reserve a separate bounded timeout budget when the RBAC scenario enters mandatory cleanup.
- Keep the existing deadline for product assertions, so a slow or stuck assertion still fails.
- Verify that cleanup restores the baseline and later tests can continue without server errors.
- Do not change product behavior, State, PostgreSQL schema, or localization.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require destructive browser scenarios to receive a bounded cleanup budget that
  cannot weaken their assertion timeout.

## Impact

The change affects the Playwright authorization scenario, its test contract, and validation
documentation. It has no production, privacy, compatibility, or export impact.

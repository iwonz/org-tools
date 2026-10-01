## Why

The CI development probe can wait forever in its first container-local health fetch because the
request has no deadline. A stalled response produces no diagnostics and consumes the job timeout,
blocking release delivery.

## What Changes

- Bound every readiness fetch and the total readiness window.
- Emit the development app status and logs when readiness cannot be established.
- Keep successful Chromium validation and cleanup behavior unchanged.
- Do not change the product runtime, persistent State, PostgreSQL data, UI, or exports.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: Require the development readiness probe to terminate with actionable
  diagnostics instead of waiting indefinitely.

## Impact

The change affects only the Compose development-check wrapper and its container-delivery contract.
There is no user-visible, privacy, compatibility, localization, database, or image-content impact.

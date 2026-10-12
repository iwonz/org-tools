## Why

`pnpm dev` can leave the development application in a restart loop after the tracked dependency
graph changes. The rebuilt image mounts an older project-scoped `node_modules` volume, and pnpm
refuses the required non-interactive purge before Next.js can start.

## What Changes

- Make the development application run pnpm in an explicitly non-interactive environment so its
  dependency status check can refresh stale disposable dependency volumes.
- Add focused regression coverage for the development Compose contract.
- Document that dependency volumes are automatically reconciled after tracked dependency changes.
- Preserve production runtime isolation, external PostgreSQL and Backup data, and the existing
  Docker-and-Git-only development workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require `pnpm dev` to reconcile stale disposable dependency volumes without
  an interactive prompt or restart loop.

## Impact

The change affects the development Compose environment, its focused source-level tests, and the
development architecture documentation. It does not change application APIs, organization data,
database migrations, dependencies, production images, remote requests, telemetry, or exports.

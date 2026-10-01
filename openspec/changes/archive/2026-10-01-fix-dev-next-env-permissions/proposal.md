## Why

The Compose development app cannot become ready on GitHub's Linux runner because Next.js needs to
write its ignored `next-env.d.ts`, while the development service runs as root with all capabilities
dropped against a checkout owned by the runner user. The existing readiness timeout now exposes
this deterministic permission failure instead of hanging, so the development container contract
must permit only the write needed by Next.js.

## What Changes

- Allow the development app container to bypass checkout file ownership for generated Next.js type
  metadata while keeping the production container non-root and capability-free.
- Add a regression check for the effective Compose security configuration and prove the development
  readiness probe succeeds on the CI runtime.
- Document the development-only permission boundary. Organization data, State, APIs, exports, and
  persistent storage are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: Require the development Compose runtime to generate ignored Next.js metadata
  across host UID ownership boundaries without weakening the production security profile.

## Impact

The development Compose override, container-delivery specification, architecture documentation,
and container configuration tests are affected. The change is compatible with existing `.env`,
PostgreSQL, Backup, and application State; it adds no network access or third-party data flow.

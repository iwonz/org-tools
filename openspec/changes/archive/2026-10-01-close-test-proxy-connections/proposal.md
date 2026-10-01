## Why

The Compose Chromium probe can finish its page checks yet remain alive indefinitely because the
loopback proxy does not own or close WebSocket upstream connections created by Next.js HMR. This
blocks CI delivery even though the application is healthy.

## What Changes

- Track both sides of upgraded proxy connections and close them deterministically with the HTTP
  server.
- Make proxy shutdown awaitable and idempotent so browser probes and suites terminate cleanly on
  success and failure.
- Add focused regression coverage for upgraded connections and document the validation boundary.
- Keep gallery hashes stable across bounded software-raster noise without accepting structural
  screenshot changes.
- Do not change application behavior, persistent State, PostgreSQL data, or production networking.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: Require Compose browser validation infrastructure to release HTTP and
  upgraded proxy connections deterministically.

## Impact

The change affects the repository-only loopback proxy and screenshot comparison used by Chromium
validation, their tests, container-delivery requirements, and architecture documentation. There is
no user-visible product, privacy, compatibility, localization, State, database, or export change.

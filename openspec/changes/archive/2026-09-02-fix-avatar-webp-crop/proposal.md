## Why

Avatar cropping currently fails when a browser canvas cannot produce a WebP `Blob`, even though the
persisted avatar contract already accepts bounded PNG, JPEG, and WebP data URLs. A local image that
can be decoded and cropped must not become unusable solely because one optional canvas encoder path
returns `null` or falls back to another safe image type.

## What Changes

- Keep WebP as the preferred 512 by 512 crop output when the browser encoder succeeds.
- Fall back to a bounded lossless PNG crop when WebP blob encoding is unavailable or returns a
  different media type.
- Apply the same resilient encoding policy to oversized-source preview preparation.
- Report one format-neutral localized encoding error only after all safe local encoders fail.
- Cover real WebP success, simulated WebP failure, PNG fallback, limits, resource cleanup, and both
  server and static browser runtimes without external requests.
- Make the in-memory tab-state startup handshake resilient to the browser registration race exposed
  by the expanded Pages regression suite.
- Keep `OrgToolsState`, SQLite, APIs, persistence behavior, and accepted source formats unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Avatar cropping prefers WebP but must retain a safe local PNG fallback when the
  browser cannot encode WebP.
- `single-state-runtime`: A newly opened browser tab retries its bounded in-memory state request so
  an already-live peer cannot be missed during channel registration.

## Impact

The change affects the browser-only avatar image helper, Employee crop error copy, avatar unit and
browser coverage, the bounded live-tab handshake, avatar documentation, and the existing screenshot
gallery. It adds no remote dependency, request, storage surface, state field, migration, or server
API.

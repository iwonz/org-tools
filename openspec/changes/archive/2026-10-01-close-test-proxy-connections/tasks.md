## 1. Proxy lifecycle

- [x] 1.1 Track and symmetrically close both sides of upgraded proxy connections.
- [x] 1.2 Make proxy shutdown awaitable and idempotent across successful and failed browser runs.
- [x] 1.3 Add focused regression tests for upgraded connection cleanup and repeated shutdown.
- [x] 1.4 Bound accepted software-raster noise so maintained gallery hashes remain deterministic.

## 2. Documentation and delivery

- [x] 2.1 Document deterministic validation-proxy cleanup in architecture and container-delivery specs.
- [x] 2.2 Run formatting, lint, typecheck, unit, dev, build, browser, screenshot, publication, image, and strict OpenSpec checks; confirm the nonvisual change leaves the 56-frame gallery deterministic.
- [x] 2.3 Sync and archive the OpenSpec change, integrate it into `main`, and confirm CI, release, and public GHCR delivery.

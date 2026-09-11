## 1. Checkout-scoped shutdown

- [x] 1.1 Add process ownership discovery, graceful shutdown, survivor verification, and the root `dev-stop` command.
- [x] 1.2 Cover multiple existing instances, relative and spaced paths, production/unrelated isolation, repeated calls, process identity changes, and stubborn workers.
- [x] 1.3 Document the command, supported platforms, and local process metadata boundary.

## 2. Validation and delivery

- [x] 2.1 Run formatting, lint, typecheck, unit tests, development check, production builds, and both browser suites.
- [x] 2.2 Generate and visually review all 59 PNGs, regenerate matching hashes, and pass Pages, public-safety, strict specification, and diff checks.
- [x] 2.3 Exercise `pnpm dev-stop` against this checkout's real dev server, confirm repeat no-op, and restore the previously running local server.
- [x] 2.4 Synchronize the capability delta and prepare the validated change for archival and integration.

Delivery follows AGENTS.md: archive, validate strictly with no active changes, commit, merge and push
main, delete the merged branch, and verify clean synchronized state.

Validation note: an initial browser run timed out in the unchanged Tag pointer-drag scenario.
The same scenario passed three isolated repetitions without source or assertion changes, then the
complete browser command passed all 51 server and 9 Pages tests. All 248 unit tests and the real
development check passed. The new command stopped the existing local server, released port 3000,
and succeeded on repetition; the restored UI and state API both returned HTTP 200.
Both gallery generations passed, all 59 PNGs were visually reviewed, and their SHA-256 hashes
matched. Pages and public-safety checks passed without publishing generated runtime artifacts.

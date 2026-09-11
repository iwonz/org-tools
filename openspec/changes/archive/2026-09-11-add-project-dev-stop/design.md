## Context

Server development uses a Node launcher and Next.js child; Pages development invokes Next.js
directly. Multiple terminals and ports can exist already, without PID files or a registry.

## Goals / Non-Goals

**Goals:** One checkout-scoped command stops server and Pages development trees, permits graceful
shutdown, handles remaining workers, and reports an idempotent no-op or an actionable failure.

**Non-Goals:** Production shutdown, other projects/checkouts, database changes, persisted process
registries, Windows process discovery, remote process control, or product UI changes.

## Decisions

- Inspect the local macOS/Linux process table with bounded `execFile` calls, not a shell. Validate
  each candidate against canonical checkout/app working directories and exact launcher or Next.js
  entry paths with the `dev` subcommand. Linux reads `/proc` working directories; macOS uses `lsof`.
  Port-based killing could stop another application. A PID registry would miss existing instances
  and add stale-record cleanup and PID-reuse hazards.
- Derive owned descendants once roots are verified, and avoid independently signaling nested roots
  during graceful shutdown. Recheck PID, start time, and command before signals; follow surviving
  descendants after reparenting. Refresh descendant tracking while waiting for shutdown.
- Give roots SIGTERM and a bounded grace period longer than the launcher's five-second child grace.
  Terminate remaining owned workers, then use SIGKILL only for verified survivors. Fail if discovery,
  permissions, or final verification prevents a reliable stop. An empty set succeeds.
- Log counts and bounded error descriptions, not process command lines or environment values.
  No state is read or written, no files are deleted, and no network access or dependency is added.
- Test isolated subprocess trees from temporary checkouts, including paths with spaces, relative
  launcher commands, Pages, multiple ports, unrelated and production processes, and forced cleanup.

## Risks / Trade-offs

- Process exits and PID reuse race with inspection → Revalidate observed identity before every signal
  and never treat a port or a broad command substring as ownership.
- Discovery permissions or missing OS tooling → Stop with a clear nonzero result; do not broaden matching.
- Already-orphaned workers without an identifiable dev ancestor → Do not guess that a generic
  `next-server` belongs to development; retain production isolation.
- Forceful termination can interrupt a development request → Allow graceful shutdown first and never
  modify SQLite files directly. Existing SQLite transaction guarantees remain in force.
- Process scans add bounded CLI-only work; Employee/Unit derivation and rendering remain unchanged.

## Delivery

No migration is required. Complete repository checks and the OpenSpec lifecycle, exercise the real
command, and restore the development server that was running before verification.

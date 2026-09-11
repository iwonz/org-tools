## Context

The launcher buffers Next.js output while probing the root and state API, then waits for an exit
event registered after warmup. An exit during the final settling delay can be missed permanently.
Shutdown also creates a separate late waiter. The launcher owns only its spawned Next.js process.

## Goals / Non-Goals

**Goals:** Observe completion from spawn onward, prevent false readiness, cancel warmup promptly,
retain useful bounded diagnostics, and cover the real subprocess lifecycle deterministically.

**Non-Goals:** Restart policy, product UI changes, state changes, database conversion, or new dependencies.

## Decisions

- Register one resolving completion promise immediately after spawn for exit and spawn errors. All
  lifecycle paths share it, avoiding late-event registration and unhandled rejected promises.
- Abort warmup on child completion, termination requests, and the existing startup deadline. Pass
  the signal to requests and delays, and check completion before readiness. A keepalive timer would
  only conceal the lost-event bug; checking exitCode only at loop entry misses in-flight exits.
- Clear deadline and shutdown timers when their work finishes. Shutdown reuses completion and retains
  bounded SIGTERM/SIGKILL escalation. Running exits preserve the child's numeric code; signal-only
  failures remain unsuccessful, and explicit launcher interruption exits cleanly.
- Exercise the unchanged launcher entrypoint in an isolated temporary tree with a synthetic loopback
  Next.js substitute. Trigger termination through request/response milestones to cover the actual
  Node warning, rather than mocking only Promise behavior. Production dev:check remains the real
  Next.js and SQLite browser verification.

## Risks / Trade-offs

- Timing-sensitive regression tests → Use server request milestones and bounded subprocess deadlines.
- Cancellation could mask diagnostics → Reveal buffered child output and report the specific exit or
  startup failure. No organization state is written by lifecycle tests.
- Extra asynchronous resources could delay exit → Abort requests/delays and clear timers explicitly.
- Loopback probes retain the existing local trust boundary; no dependency or large-model work changes.

## Migration Plan

No persisted-state migration is needed. Validate, archive, merge, and restart the owned local launcher.
Rollback is a source revert with no organization data conversion.

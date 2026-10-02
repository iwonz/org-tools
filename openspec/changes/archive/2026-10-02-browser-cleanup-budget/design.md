## Context

The authorization browser scenario creates roles, accounts, sessions, grants, and ACL changes, then
restores an encrypted baseline in `finally`. Playwright applies one timeout to the test body and its
cleanup. Cold compilation variance can consume that timeout after all assertions have passed; an
aborted restore can hold maintenance state and invalidate every following result in the shard.

## Goals / Non-Goals

**Goals:**

- Preserve the existing bounded deadline for product assertions.
- Give mandatory cleanup its own bounded two-minute reserve.
- Keep the shard usable even when the scenario itself fails.

**Non-Goals:**

- Relax assertions, retries, or product operation timeouts.
- Change Backup/Restore runtime behavior or production state.

## Decisions

Pass Playwright `testInfo` to the scenario and extend the total timeout only on entry to `finally`.
The extension is relative to the original test budget and therefore cannot help a slow assertion
pass. It only lets context closure, reauthentication, and encrypted restore finish after the main
body has completed or thrown.

Keep the cleanup reserve at two minutes. Normal restore takes seconds; the bound covers cold route
compilation and Argon2 work while still failing a genuinely stuck cleanup. A blanket increase at
test start was rejected because it would weaken the assertion deadline and obscure regressions.

## Risks / Trade-offs

- **Cleanup can make a failed scenario report later.** The reserve is bounded and protects the
  integrity of every later test in the shard.
- **A timeout raised during the body still fails.** Extending in `finally` only permits cleanup; it
  does not erase the original exception.

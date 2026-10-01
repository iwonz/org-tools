## Context

The production Compose service drops every Linux capability and runs as UID 10001. The development
override intentionally changes the app user to root so it can work with Docker-managed dependency
and `.next` volumes, but Compose retains the base service's `cap_drop: [ALL]`. On a Linux runner the
bind-mounted checkout is owned by the runner UID, so capability-free root cannot create or update
the ignored `apps/ui/next-env.d.ts` file that Next.js generates before serving requests. The process
logs "Ready" and then rejects the write, leaving health checks pending.

There is no organization-data flow in this path. The affected file contains only bundled Next.js
type references and remains ignored by Git and excluded from images.

## Goals / Non-Goals

**Goals:**

- Let the development app generate Next.js metadata across host UID ownership boundaries.
- Preserve the production app's non-root user, read-only filesystem, and empty capability set.
- Make the development-only exception explicit and regression-tested.
- Prove the real Compose readiness and Chromium probe complete.

**Non-Goals:**

- Change application State, PostgreSQL, Backup storage, authentication, or authorization.
- Grant the development app broad Linux capabilities.
- Persist generated metadata outside the ignored checkout and disposable Compose volumes.

## Decisions

### Add only `DAC_OVERRIDE` in the development override

The development app will retain `cap_drop: [ALL]` from the production service and add back only
`DAC_OVERRIDE`. This capability lets root write the runner-owned generated metadata and nothing
else is required for Next.js startup. The production Compose model does not load the development
override and therefore receives no added capability.

Running the development app as the host UID was considered, but the app also writes Docker-managed
dependency and `.next` volumes whose ownership is not portable across Linux and Docker Desktop.
Pre-generating a hard-coded `next-env.d.ts` on the host was rejected because its content is owned by
Next.js and changes with framework behavior and routing settings. Removing `cap_drop: [ALL]` from the
development service would grant a much larger privilege set than needed.

### Guard the composed security boundary

A unit test will inspect both Compose files and assert that the development override adds only
`DAC_OVERRIDE`, while the production app continues to drop all capabilities, run non-root, and use a
read-only root filesystem. The existing real `org-tools-dev-check` remains the integration proof:
it waits for readiness with bounded diagnostics and launches Chromium against the running service.

## Risks / Trade-offs

- **Development root can bypass host file ownership inside mounted paths** -> The exception is limited
  to the development override and a single capability; production stays unchanged and the generated
  file is ignored and publication-scanned.
- **A future Next.js version may need another write location** -> The bounded readiness check reports
  the exact failing path; capabilities are expanded only after a separately reviewed change.
- **Compose merge behavior could accidentally alter production hardening** -> The regression test
  verifies both the base service and the explicit development override contract.

## Migration Plan

No data or configuration migration is required. Rebuilding the development app applies the override.
Rollback removes the development-only capability and restores the prior startup failure without
affecting PostgreSQL or Backup data.

## Open Questions

None.

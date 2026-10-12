## Context

The development image contains dependencies installed from the tracked lockfile, but Compose mounts
project-scoped named volumes over the image's dependency directories. Docker initializes a new
volume from the image once and then preserves it across rebuilds. After a dependency update, pnpm's
pre-run dependency check correctly tries to replace the stale modules tree; because the Compose
application has no interactive terminal, pnpm 11 aborts the purge and the restart policy repeats
the same failure.

The volumes are deliberately disposable and contain no organization data. PostgreSQL and Backup
state remain on separate absolute external bind paths.

## Goals / Non-Goals

**Goals:**

- Let `pnpm dev` repair stale application dependency volumes without user interaction.
- Preserve hot reload, project-scoped dependency isolation, and the pinned container toolchain.
- Cover the non-interactive Compose contract with a focused automated assertion and a real startup
  verification against the volume that reproduced the failure.

**Non-Goals:**

- Deleting volumes on every start or changing external PostgreSQL and Backup storage.
- Sharing the toolbox and application dependency volumes.
- Changing production container behavior, pnpm versions, or the dependency graph.

## Decisions

1. The development `app` service will set `CI=true`, matching the existing toolbox service. pnpm
   explicitly recognizes CI as a non-interactive environment and may replace an incompatible
   modules directory instead of asking for confirmation. This is preferred over deleting named
   volumes because it preserves warm dependency caches, and over disabling pnpm's dependency check
   because that could start Next.js with an incorrect graph.
2. The setting remains scoped to the development override. The production image and service keep
   their current environment and security boundary, while Next.js continues to run in development
   mode with file watching and hot reload.
3. The focused Compose test will require the application environment to declare non-interactive
   operation while confirming that the production service does not inherit it. Runtime validation
   will then start the previously failing stack and wait for application readiness.

## Risks / Trade-offs

- **CI mode can reduce decorative terminal behavior in development logs.** → Accept the narrower
  output because the service has no interactive terminal and reliable dependency repair is the
  required behavior.
- **A stale volume repair may take longer than an unchanged restart.** → pnpm runs the install only
  when its dependency status check finds a mismatch; unchanged warm starts retain the existing
  volume.
- **An interrupted repair can leave the disposable volume incomplete.** → The restart policy reruns
  pnpm's checked install; organization and backup data are outside these volumes and remain
  untouched.

## Migration Plan

No application or database migration is required. The first `pnpm dev` after adoption reconciles
any stale dependency volume automatically. Reverting the Compose environment restores the previous
behavior but can reintroduce the non-interactive restart loop after a dependency change.

## Open Questions

None.

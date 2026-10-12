## MODIFIED Requirements

### Requirement: Container tooling is reproducible
The development and CI toolbox SHALL pin Node, pnpm, PostgreSQL, browser, and OpenSpec versions through
tracked image and lock inputs. Every documented format, lint, typecheck, unit, integration, browser,
screenshot, build, migration, specification, and publication command SHALL run through Compose on a
host with Docker and Git only. The development launcher SHALL reconcile stale disposable dependency
volumes without an interactive prompt or application restart loop.

#### Scenario: Validate a clean checkout
- **WHEN** a contributor initializes `.env` and runs the documented Compose validation entry point
- **THEN** the pinned toolbox executes the complete repository checks without host Node or pnpm

#### Scenario: Start after a dependency graph change
- **WHEN** a contributor runs `pnpm dev` after tracked dependency inputs have changed while an older
  project-scoped dependency volume exists
- **THEN** pnpm refreshes the disposable volume non-interactively and the development application
  reaches readiness without deleting PostgreSQL or Backup data

## REMOVED Requirements

### Requirement: Package-manager startup is reproducible
**Reason**: Host pnpm is no longer the supported development entry point.
**Migration**: Pin Node and pnpm inside the Docker development/toolbox image and invoke repository scripts through Compose.

### Requirement: Local runtime and database artifacts are publication-safe
**Reason**: The SQLite-specific runtime and publication boundary is removed.
**Migration**: Use PostgreSQL external bind storage and scan the repository, build context, image, and artifacts for all database and credential material.

### Requirement: Documentation and automation are publication-ready
**Reason**: The requirement describes Pages, complete State transfer, and two runtimes.
**Migration**: Document the authenticated container product, Backup/Restore, permission-filtered outputs, and one 56-frame server gallery.

### Requirement: Development startup has a bounded functional probe
**Reason**: Development no longer starts a host process with temporary SQLite.
**Migration**: Compose health coverage initializes ephemeral PostgreSQL, migrations, setup/login, shell, and Editor and always removes owned test resources.

### Requirement: Repository validation includes the static browser application
**Reason**: The static Pages application is removed.
**Migration**: Validate the production server image, Compose stack, authenticated browser workflows, and GHCR metadata.

### Requirement: Development launcher observes the complete child lifecycle
**Reason**: Compose owns development processes instead of the custom host launcher.
**Migration**: The supported wrapper delegates lifecycle and bounded diagnostics to Docker Compose.

### Requirement: Development instances can be stopped by checkout
**Reason**: PID-file host processes are removed.
**Migration**: The supported stop command uses the checkout-specific Compose project name and removes only its containers and networks.

### Requirement: Strict State changes prepare the configured local database before publication
**Reason**: The current change replaces SQLite with versioned PostgreSQL migrations and one external conversion.
**Migration**: Validate the owned SQLite source, PostgreSQL target, normal restart, and external backup before publication.

## ADDED Requirements

### Requirement: Container tooling is reproducible
The development and CI toolbox SHALL pin Node, pnpm, PostgreSQL, browser, and OpenSpec versions through
tracked image and lock inputs. Every documented format, lint, typecheck, unit, integration, browser,
screenshot, build, migration, specification, and publication command SHALL run through Compose on a
host with Docker and Git only.

#### Scenario: Validate a clean checkout
- **WHEN** a contributor initializes `.env` and runs the documented Compose validation entry point
- **THEN** the pinned toolbox executes the complete repository checks without host Node or pnpm

### Requirement: Server and image validation replace Pages validation
CI SHALL start ephemeral PostgreSQL, run checked migrations, exercise Setup/Login and representative
roles, build the hardened server image, run both unit and browser suites, generate exactly 56 server
PNGs twice, compare hashes, and scan tracked files, build context, image layers, and runtime resources.

#### Scenario: Continuous validation
- **WHEN** CI runs for a pull request
- **THEN** all server, authorization, PostgreSQL, image, locale, gallery, performance, OpenSpec, and publication-safety checks pass without publishing an image

### Requirement: Release automation is part of the closed lifecycle
The delivery lifecycle SHALL include Release Please configuration, a passing release PR, public GHCR
multi-platform publication, SBOM and provenance verification, and an anonymous pull check for a
stable release. Publication failure SHALL be reported without claiming the lifecycle is complete.

#### Scenario: Deliver the first stable release
- **WHEN** the archived implementation reaches synchronized `main`
- **THEN** the generated `v1.0.0` release PR is verified and merged and its GitHub Release and public image tags are confirmed

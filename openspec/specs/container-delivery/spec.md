# container-delivery Specification

## Purpose
TBD - created by archiving change enterprise-auth-access-control. Update Purpose after archive.
## Requirements
### Requirement: Environment configuration is explicit and secret-safe
The repository SHALL contain a root `.env.example` listing the complete supported environment contract
without real credentials. A supported initialization command SHALL create a missing mode-0600 `.env`,
generate cryptographically strong setup and database credentials, resolve external storage paths
under the user's home directory, and refuse overwrite, placeholders, relative paths, or paths inside
the checkout. Environment files and secrets SHALL NOT enter images or Git.

#### Scenario: Initialize local configuration
- **WHEN** `.env` is absent and an operator runs environment initialization
- **THEN** a valid file and external PostgreSQL/Backup directories are created without printing secrets

#### Scenario: Protect existing configuration
- **WHEN** `.env` already exists
- **THEN** initialization fails without reading secrets into output or changing the file

### Requirement: Compose is the complete development and deployment runtime
The production Compose model SHALL include external-bind PostgreSQL 18, storage preparation, a
one-shot migration service, and the application. PostgreSQL data SHALL mount from
`ORG_TOOLS_POSTGRES_DATA_PATH` to `/var/lib/postgresql` as a bind and SHALL NOT use a named or
anonymous database volume. A development override SHALL provide local build, hot reload, and a
container toolbox for every documented development and validation command.

#### Scenario: Start a new development environment
- **WHEN** an operator with only Docker and Git initializes environment and starts development Compose
- **THEN** PostgreSQL initializes externally, migrations finish, and the authenticated app becomes ready

#### Scenario: Recreate containers
- **WHEN** all Compose containers are removed and recreated using the same configured paths
- **THEN** PostgreSQL and Backup data persist outside the repository

### Requirement: The production image is minimal and hardened
The multi-stage image SHALL contain Next.js standalone runtime output, migrations, bundled fonts, and
local static assets only. The application SHALL run non-root with dropped capabilities, a read-only
root filesystem, and explicit writable tmpfs or external Backup storage. It SHALL contain no source
fixtures, environment files, VCS data, SQLite, PostgreSQL data, test output, or remote assets.

#### Scenario: Inspect the production image
- **WHEN** CI exports the image filesystem, configuration, and history
- **THEN** only required runtime files and nonsecret OCI metadata are present

### Requirement: Docker Run reproduces Compose without evaluating environment code
A supported Docker Run workflow SHALL parse only allowlisted `.env` keys without shell evaluation,
create the application network, run PostgreSQL with the same external bind, run migration to
completion, and start the same application image. README SHALL document Compose, Docker Run,
external HTTPS, updates, Backup/Restore, and PostgreSQL major upgrades.

#### Scenario: Deploy through Docker Run
- **WHEN** an operator follows the documented Docker Run workflow with a valid `.env`
- **THEN** it produces the same schema, storage boundaries, readiness, and application behavior as Compose

### Requirement: CI and publication cannot leak organization data
CI databases SHALL be ephemeral and SHALL NOT be uploaded. Publication checks SHALL reject tracked or
image-contained `.env`, database, dump, Backup, credential, organization fixture, or forbidden build
artifact content and SHALL validate that the PostgreSQL mount is an external bind.

#### Scenario: Detect an accidental data file
- **WHEN** a database, Backup, live credential, or generated `.env` becomes tracked or enters the image
- **THEN** CI and publication fail with the offending path without printing secret content

### Requirement: SemVer releases publish verified public GHCR images
Release Please SHALL maintain the root version, CHANGELOG, release PR, SemVer tag, and GitHub Release.
The first stable release SHALL be `v1.0.0`. Main commits SHALL publish public `edge` and commit tags;
stable releases SHALL publish full, minor, major, and `latest` tags for Linux amd64 and arm64. Images
SHALL include OCI metadata, SBOM, and GitHub provenance, and `latest` SHALL never follow unreleased main.

#### Scenario: Publish a stable release
- **WHEN** a passing Release Please PR is merged and creates a SemVer release
- **THEN** the matching public multi-platform tags, release notes, SBOM, and provenance are available

#### Scenario: Validate a pull request
- **WHEN** CI runs for a pull request
- **THEN** it builds and tests the production image without publishing any registry tag

### Requirement: Development runtime output is isolated per Compose project
The development app service SHALL store its Next.js output and dependencies in disposable
Compose-project-scoped volumes rather than sharing writable runtime directories with the toolbox.
The toolbox SHALL retain separate checkout build output for production validation. Development
runtime output SHALL NOT contain durable organization data and SHALL NOT be used as PostgreSQL or
Backup storage.

#### Scenario: Run concurrent development projects
- **WHEN** two Compose projects use the same checkout or a toolbox install/build runs beside the development app
- **THEN** each development server owns its lock, dependencies, and output without restarting or corrupting the other process

#### Scenario: Remove development resources
- **WHEN** the supported teardown runs with volume removal
- **THEN** the disposable Next.js output is removed while external PostgreSQL and Backup paths remain intact

#### Scenario: Validate the Backup bind after startup
- **WHEN** the preparation service has assigned the Backup directory to the non-root runtime user
- **THEN** the host wrapper can traverse and canonicalize the configured directory without listing or reading mode-0600 Backup files

### Requirement: Browser validation releases proxy connections deterministically

The Compose browser-validation loopback proxy SHALL own and release ordinary HTTP connections and
both sides of every upgraded connection. Its shutdown SHALL be awaitable, idempotent, stop new
connections, and resolve only after the listening server and tracked connections are closed.

#### Scenario: Close an upgraded development connection

- **WHEN** a browser validation completes while a Next.js HMR upgraded connection is active
- **THEN** proxy shutdown closes the browser and upstream sockets and the validation process exits

#### Scenario: Repeat proxy shutdown

- **WHEN** cleanup invokes proxy shutdown more than once after success or failure
- **THEN** every caller observes the same completed shutdown without an exception or leaked handle

### Requirement: Gallery comparison bounds software-raster noise

Screenshot generation SHALL preserve an existing maintained PNG when a candidate changes no more
than 256 pixels and every unmarked changed channel differs by at most 3. A candidate outside either
bound SHALL replace the file for review.

#### Scenario: Ignore an imperceptible raster variation

- **WHEN** repeated headless Chromium capture changes at most 256 pixels by no more than 3 channel levels
- **THEN** the maintained PNG remains byte-identical and repeated gallery hashes match

#### Scenario: Surface a meaningful screenshot change

- **WHEN** a candidate exceeds the pixel budget or maximum channel delta outside an explicitly marked raster region
- **THEN** screenshot generation writes the candidate so repository review exposes the change

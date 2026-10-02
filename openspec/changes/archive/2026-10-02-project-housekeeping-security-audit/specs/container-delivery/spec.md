## ADDED Requirements

### Requirement: Production dependencies are patched and auditable
The committed lockfile and production image SHALL resolve application runtime dependencies outside
known high or critical advisory ranges at delivery time. A maintained command SHALL audit production
dependencies explicitly, and Dependabot SHALL continue to monitor npm, Docker, and GitHub Actions.

#### Scenario: Validate a release candidate
- **WHEN** complete validation runs for a release candidate
- **THEN** the production dependency audit passes before the application image is published

#### Scenario: Advisory affects a runtime dependency
- **WHEN** the registry reports a high or critical advisory in the installed production graph
- **THEN** validation blocks delivery until a patched resolution or separately reviewed change is committed

## MODIFIED Requirements

### Requirement: The production image is minimal and hardened
The multi-stage image SHALL contain patched Next.js standalone runtime output, migrations, bundled
fonts, and local static assets only. The application SHALL run non-root with dropped capabilities, a
read-only root filesystem, no-new-privileges, and explicit writable tmpfs or external Backup storage.
The image and its history SHALL contain no source fixtures, environment files, credentials, VCS data,
SQLite, PostgreSQL data, dumps, Backups, test reports, development dependencies, or remote assets.

#### Scenario: Inspect the production image
- **WHEN** CI exports the image filesystem, configuration, and history
- **THEN** only required runtime files and nonsecret OCI metadata are present and the configured user is non-root

### Requirement: CI and publication cannot leak organization data
CI databases SHALL be isolated, ephemeral external test paths and SHALL NOT be uploaded. Source,
build-context, production-build, and image checks SHALL reject tracked or packaged environment files,
database or dump material, Backups, credentials, organization fixtures, generated reports, and
forbidden build artifacts, and SHALL validate that the PostgreSQL data mount is an external bind.

#### Scenario: Detect an accidental data file
- **WHEN** database, Backup, live credential, generated environment, or test report material becomes tracked or enters the build context or image
- **THEN** CI and publication fail with the offending path without printing its contents
